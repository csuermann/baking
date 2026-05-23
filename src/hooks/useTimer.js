import { useState, useEffect, useRef, useCallback } from 'react'
import useLocalStorage from './useLocalStorage'

export default function useTimer(key, durationMs) {
  const [stored, setStored] = useLocalStorage(key, null)
  const [, forceUpdate] = useState(0)
  const notifiedRef = useRef(false)
  const intervalRef = useRef(null)

  const getRemainingMs = useCallback(() => {
    if (!stored) return durationMs
    if (stored.paused) return stored.remainingAtPause
    const elapsed = Date.now() - stored.startedAt
    return Math.max(0, stored.remainingAtPause - elapsed)
  }, [stored, durationMs])

  const isRunning = !!(stored && !stored.paused && getRemainingMs() > 0)
  const isDone = !!(stored && getRemainingMs() === 0)

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => forceUpdate(n => n + 1), 250)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  useEffect(() => {
    if (isDone && !notifiedRef.current && stored) {
      const expiredAt = stored.startedAt + stored.remainingAtPause
      if (Date.now() - expiredAt < 5 * 60 * 1000) {
        notifiedRef.current = true
        if (Notification.permission === 'granted') {
          new Notification('Timer done!', { body: 'Your baking step is complete.' })
        }
      }
    }
    if (!isDone) notifiedRef.current = false
  }, [isDone, stored])

  const start = useCallback(async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    const remaining = stored ? getRemainingMs() : durationMs
    setStored({ startedAt: Date.now(), paused: false, remainingAtPause: remaining })
  }, [stored, durationMs, getRemainingMs, setStored])

  const pause = useCallback(() => {
    setStored(prev => prev ? { ...prev, paused: true, remainingAtPause: getRemainingMs() } : null)
  }, [getRemainingMs, setStored])

  const reset = useCallback(() => setStored(null), [setStored])

  return {
    remainingMs: getRemainingMs(),
    isRunning,
    isDone,
    started: !!stored,
    start,
    pause,
    reset,
  }
}
