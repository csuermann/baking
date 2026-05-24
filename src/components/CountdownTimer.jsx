import { useEffect, useRef } from 'react'

function formatCountdown(ms) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatElapsed(ms) {
  const totalSecs = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtMins(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  return h > 0 ? `${h}h` : `${m}m`
}

// Props:
//   elapsedMs        — ms since step became active (always >= 0)
//   intendedMs       — intended step duration in ms (from slider / default)
//   durationMin      — step minimum duration in minutes
//   durationMax      — step maximum duration in minutes
//   isVariable       — whether the track is draggable (variable range > 2 h)
//   onIntendedChange — called with new minutes when baker drags the thumb
export default function CountdownTimer({ elapsedMs, intendedMs, durationMin, durationMax, isVariable, onIntendedChange }) {
  const maxMs = durationMax * 60 * 1000
  const minMs = durationMin * 60 * 1000

  const isOverrun = elapsedMs > intendedMs
  const remainingMs = Math.max(0, intendedMs - elapsedMs)
  const isDone = elapsedMs >= intendedMs

  // Thumb tracks whichever is further right: intended target or current elapsed
  const thumbMs = Math.max(intendedMs, elapsedMs)
  const thumbMins = Math.round(thumbMs / 60000)

  // All positions as percentages of the full track (0 → durationMax)
  const safe = maxMs > 0 ? maxMs : 1
  const minPct     = (minMs  / safe) * 100
  const elapsedPct = Math.min(100, (elapsedMs  / safe) * 100)
  const intendedPct = Math.min(100, (intendedMs / safe) * 100)
  const thumbPct   = Math.min(100, (thumbMs    / safe) * 100)

  // Range input always tracks the intended target (clamped to valid range)
  const clampedIntendedMins = Math.max(durationMin, Math.min(durationMax, Math.round(intendedMs / 60000)))

  // Notification: fire when elapsed reaches intended; re-arm when intended changes
  const notifiedForRef = useRef(null)
  useEffect(() => {
    if (elapsedMs < intendedMs) return
    if (notifiedForRef.current === intendedMs) return
    notifiedForRef.current = intendedMs
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Step complete!', { body: 'Your baking step has elapsed.' })
    }
  }, [elapsedMs, intendedMs])

  return (
    <div className="mt-3">
      {/* Labels (variable steps only) — absolutely positioned over their track location */}
      {isVariable && (
        <div className="relative h-4 mb-1">
          {/* Min label: stable anchor at the start of the valid zone */}
          <span
            className="absolute text-xs text-stone-400 dark:text-stone-500 -translate-x-1/2"
            style={{ left: `${minPct}%` }}
          >
            {fmtMins(durationMin)}
          </span>
          {/* Current target label: hidden only when close enough to overlap an anchor */}
          {Math.abs(thumbPct - minPct) > 8 && Math.abs(thumbPct - 100) > 8 && (
            <span
              className="absolute text-xs font-medium text-stone-600 dark:text-stone-300 -translate-x-1/2"
              style={{ left: `${thumbPct}%` }}
            >
              {fmtMins(thumbMins)}
            </span>
          )}
          {/* Max label: stable anchor at the right edge */}
          <span className="absolute right-0 text-xs text-stone-400 dark:text-stone-500">
            {fmtMins(durationMax)}
          </span>
        </div>
      )}

      {/* Visual progress track */}
      <div className="relative h-4 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />

        {/* Valid zone highlight (variable steps: min → max) */}
        {isVariable && minPct < 100 && (
          <div
            className="absolute h-2 rounded-r-full bg-amber-100 dark:bg-amber-900/30"
            style={{ left: `${minPct}%`, right: 0 }}
          />
        )}

        {/* Elapsed fill */}
        <div
          className="absolute h-2 left-0 rounded-l-full bg-amber-400 dark:bg-amber-500"
          style={{ width: `${elapsedPct}%` }}
        />

        {/* Tick mark at original target when overrun */}
        {isOverrun && intendedPct > 0 && (
          <div
            className="absolute h-4 w-0.5 bg-amber-600 dark:bg-amber-300"
            style={{ left: `${intendedPct}%`, transform: 'translateX(-50%)' }}
          />
        )}

        {/* Thumb */}
        <div
          className={`absolute w-3 h-3 rounded-full border-2 ${
            isVariable
              ? 'bg-white dark:bg-stone-200 border-amber-500'
              : 'bg-white dark:bg-stone-300 border-stone-400 dark:border-stone-500'
          }`}
          style={{ left: `${thumbPct}%`, transform: 'translateX(-50%)' }}
        />

        {/* Invisible range input overlay — drag to set intended duration */}
        {isVariable && (
          <input
            type="range"
            min={durationMin}
            max={durationMax}
            step={15}
            value={clampedIntendedMins}
            onChange={e => onIntendedChange(Number(e.target.value))}
            className="absolute h-full opacity-0 cursor-pointer"
            style={{ left: `${minPct}%`, width: `${100 - minPct}%` }}
          />
        )}
      </div>

      {/* Elapsed + countdown row */}
      <div className="flex items-center mt-2">
        <span className="text-sm text-stone-400 dark:text-stone-500 tabular-nums whitespace-nowrap">
          in step for {formatElapsed(elapsedMs)}
        </span>
        {isDone ? (
          <span className="ml-auto text-sm text-red-500 dark:text-red-400 tabular-nums whitespace-nowrap">
            {formatElapsed(elapsedMs - intendedMs)} overdue
          </span>
        ) : (
          <span className="ml-auto text-sm text-stone-400 dark:text-stone-500 tabular-nums whitespace-nowrap">
            {formatCountdown(remainingMs)} remaining
          </span>
        )}
      </div>
    </div>
  )
}
