import { useMemo, useState } from 'react'
import { addMinutes, format } from 'date-fns'
import { getDefaultDuration } from '../utils/schedule'

const MAX_OFFSET_MINS = 72 * 60  // 72 hours ahead
const STEP_MINS = 15

// Floor current time to the nearest 15-min boundary so slider steps hit clean quarter-hours
function quarterFloor(date) {
  const d = new Date(date)
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0)
  return d
}

export default function SchedulePlanner({ steps, anchor, onAnchorChange }) {
  const [open, setOpen] = useState(false)

  const totalMinutes = useMemo(
    () => steps.reduce((sum, s) => sum + getDefaultDuration(s), 0),
    [steps]
  )
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  const durationLabel = m > 0 ? `${h}h ${m}m` : `${h}h`

  // Slider value = minutes from the floored-now to start. Clamped to [0, MAX].
  const base = quarterFloor(new Date())
  const sliderValue = useMemo(() => {
    if (!anchor) return 0
    const diff = Math.round((new Date(anchor.datetime) - base) / 60000)
    return Math.max(0, Math.min(MAX_OFFSET_MINS, Math.round(diff / STEP_MINS) * STEP_MINS))
  }, [anchor])

  // Display times: use anchor if set, otherwise project from base
  const startDate = anchor ? new Date(anchor.datetime) : addMinutes(base, sliderValue)
  const endDate   = addMinutes(startDate, totalMinutes)
  const startLabel = (anchor && sliderValue > 0) ? format(startDate, 'EEE HH:mm') : 'Now'
  const endLabel   = format(endDate, 'EEE HH:mm')

  const headerLabel = anchor
    ? `${format(startDate, 'EEE HH:mm')} → ${endLabel}`
    : `${durationLabel} total`

  const handleChange = e => {
    const mins = Number(e.target.value)
    onAnchorChange({ type: 'start', datetime: format(addMinutes(quarterFloor(new Date()), mins), "yyyy-MM-dd'T'HH:mm") })
  }

  return (
    <div className="mb-6 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/60 text-left"
      >
        <span className="font-medium text-stone-700 dark:text-stone-300">Schedule</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {headerLabel} {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white dark:bg-stone-900">

          {/* Start / End labels */}
          <div className="flex justify-between mb-3">
            <div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Start</div>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">{startLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Est. end</div>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">{endLabel}</div>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={MAX_OFFSET_MINS}
            step={STEP_MINS}
            value={sliderValue}
            onChange={handleChange}
            className="w-full accent-amber-500"
          />

          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone-400 dark:text-stone-500">Now</span>
            <span className="text-xs text-stone-400 dark:text-stone-500">+72 h</span>
          </div>

          {anchor && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onAnchorChange(null)}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
