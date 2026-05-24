import { useState, useCallback, useEffect } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Re-read from localStorage when the sync layer hydrates all keys at once.
  // The 'baking-hydrated' event is dispatched by useSync after a successful pull.
  useEffect(() => {
    const handler = () => {
      try {
        const item = localStorage.getItem(key)
        if (item !== null) setStoredValue(JSON.parse(item))
      } catch {}
    }
    window.addEventListener('baking-hydrated', handler)
    return () => window.removeEventListener('baking-hydrated', handler)
  }, [key])

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [key])

  return [storedValue, setValue]
}
