import { useEffect, useRef } from 'react'
import useTimer from '../hooks/useTimer'

function formatTime(ms) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer({ timerKey, durationMs, onTimerStart, onTimerReset }) {
  const { remainingMs, isRunning, isDone, started, start, pause, reset } = useTimer(timerKey, durationMs)

  const prevDurationRef = useRef(durationMs)
  useEffect(() => {
    if (durationMs === prevDurationRef.current) return
    prevDurationRef.current = durationMs
    if (started && !isDone) {
      reset()
    }
  }, [durationMs, started, isDone, reset])

  const handleStart = () => {
    onTimerStart?.(Date.now() + remainingMs)
    start()
  }

  const handleReset = () => {
    onTimerReset?.()
    reset()
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <span
        className={`font-mono text-sm tabular-nums min-w-[4rem] ${
          isDone ? 'text-green-600 dark:text-green-400' : 'text-stone-600 dark:text-stone-400'
        }`}
      >
        {formatTime(remainingMs)}
      </span>

      {!isRunning && !isDone && (
        <button
          onClick={handleStart}
          className="text-xs px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
        >
          {started ? 'Resume' : 'Start timer'}
        </button>
      )}
      {isRunning && (
        <button
          onClick={pause}
          className="text-xs px-3 py-1 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 transition-colors"
        >
          Pause
        </button>
      )}
      {started && (
        <button
          onClick={handleReset}
          className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          Reset
        </button>
      )}
      {isDone && <span className="text-xs font-medium text-green-600 dark:text-green-400">Done!</span>}
    </div>
  )
}
