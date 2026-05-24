import { useMemo, useState } from 'react'
import { addMinutes, subMinutes, format } from 'date-fns'
import { getDefaultDuration } from '../utils/schedule'

function toDatetimeLocal(date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
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

  const startValue = useMemo(() => {
    if (!anchor) return ''
    if (anchor.type === 'start') return anchor.datetime
    return toDatetimeLocal(subMinutes(new Date(anchor.datetime), totalMinutes))
  }, [anchor, totalMinutes])

  const finishValue = useMemo(() => {
    if (!anchor) return ''
    if (anchor.type === 'finish') return anchor.datetime
    return toDatetimeLocal(addMinutes(new Date(anchor.datetime), totalMinutes))
  }, [anchor, totalMinutes])

  const handleStart = e => {
    if (!e.target.value) { onAnchorChange(null); return }
    onAnchorChange({ type: 'start', datetime: e.target.value })
  }

  const handleFinish = e => {
    if (!e.target.value) { onAnchorChange(null); return }
    onAnchorChange({ type: 'finish', datetime: e.target.value })
  }

  const inputCls = 'w-full max-w-full text-base border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="mb-6 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/60 text-left"
      >
        <span className="font-medium text-stone-700 dark:text-stone-300">Schedule</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {anchor
            ? (anchor.type === 'finish' ? `Finish: ${format(new Date(anchor.datetime), 'EEE HH:mm')}` : `Start: ${format(new Date(anchor.datetime), 'EEE HH:mm')}`)
            : `${durationLabel} total`
          } {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white dark:bg-stone-900 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Start time</span>
              <input type="datetime-local" className={inputCls} value={startValue} onChange={handleStart} />
            </label>
            <label className="min-w-0">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Target finish</span>
              <input type="datetime-local" className={inputCls} value={finishValue} onChange={handleFinish} />
            </label>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Total estimated time: <strong className="text-stone-600 dark:text-stone-400">{durationLabel}</strong>
          </p>
          {anchor && (
            <button
              onClick={() => onAnchorChange(null)}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline"
            >
              Clear schedule
            </button>
          )}
        </div>
      )}
    </div>
  )
}
