import { useMemo, useState } from 'react'
import { addMinutes, subMinutes, format } from 'date-fns'
import { getDefaultDuration } from '../utils/schedule'

const DAY_OFFSETS = [
  { label: 'Today',    offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: '+2 days',  offset: 2 },
]

function dateStringForOffset(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function offsetForDateString(dateStr) {
  // Returns 0/1/2 if dateStr matches today/tomorrow/+2, else null
  for (let i = 0; i <= 2; i++) {
    if (dateStr === dateStringForOffset(i)) return i
  }
  return null
}

export default function SchedulePlanner({ steps, anchor, onAnchorChange }) {
  const [open, setOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState('start')
  const [pendingDay, setPendingDay] = useState(0)

  const totalMinutes = useMemo(
    () => steps.reduce((sum, s) => sum + getDefaultDuration(s), 0),
    [steps]
  )
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  const durationLabel = m > 0 ? `${h}h ${m}m` : `${h}h`

  // Derive controlled values from anchor prop
  const anchorDatePart = anchor?.datetime?.split('T')[0] ?? ''
  const anchorTimePart = anchor?.datetime?.split('T')[1] ?? ''
  const anchorDayOffset = anchorDatePart ? offsetForDateString(anchorDatePart) : null

  const activeMode      = anchor ? anchor.type  : pendingMode
  const activeDayOffset = anchor ? anchorDayOffset : pendingDay
  const activeTime      = anchorTimePart

  // Derived start / finish datetimes for the summary row
  const startDatetime = anchor
    ? (anchor.type === 'start'
        ? anchor.datetime
        : format(subMinutes(new Date(anchor.datetime), totalMinutes), "yyyy-MM-dd'T'HH:mm"))
    : null
  const finishDatetime = anchor
    ? (anchor.type === 'finish'
        ? anchor.datetime
        : format(addMinutes(new Date(anchor.datetime), totalMinutes), "yyyy-MM-dd'T'HH:mm"))
    : null

  const headerLabel = anchor
    ? `${anchor.type === 'start' ? 'Start' : 'Finish'} ${format(new Date(anchor.datetime), 'EEE HH:mm')}`
    : `${durationLabel} total`

  // --- handlers ---

  const commit = (mode, dayOffset, time) => {
    if (!time) { onAnchorChange(null); return }
    onAnchorChange({ type: mode, datetime: `${dateStringForOffset(dayOffset)}T${time}` })
  }

  const handleModeToggle = newMode => {
    setPendingMode(newMode)
    if (anchor && anchor.type !== newMode) {
      const shifted = newMode === 'finish'
        ? addMinutes(new Date(anchor.datetime), totalMinutes)
        : subMinutes(new Date(anchor.datetime), totalMinutes)
      onAnchorChange({ type: newMode, datetime: format(shifted, "yyyy-MM-dd'T'HH:mm") })
    }
  }

  const activeHour   = activeTime ? activeTime.split(':')[0] : ''
  const activeMinute = activeTime ? activeTime.split(':')[1] : ''

  const handleDayToggle = offset => {
    setPendingDay(offset)
    if (activeTime) commit(activeMode, offset, activeTime)
  }

  const handleHourChange = hour => {
    const minute = activeMinute || '00'
    commit(activeMode, activeDayOffset ?? pendingDay, hour ? `${hour}:${minute}` : '')
  }

  const handleMinuteChange = minute => {
    if (activeHour) commit(activeMode, activeDayOffset ?? pendingDay, `${activeHour}:${minute}`)
  }

  // --- styles ---
  const chip = (active) =>
    `px-3 py-1.5 rounded-lg text-sm border transition-colors ${
      active
        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 font-medium'
        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
    }`

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
        <div className="px-4 py-4 bg-white dark:bg-stone-900 space-y-3">

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button className={chip(activeMode === 'start')}  onClick={() => handleModeToggle('start')}>
              Start at
            </button>
            <button className={chip(activeMode === 'finish')} onClick={() => handleModeToggle('finish')}>
              Finish at
            </button>
          </div>

          {/* Day chips */}
          <div className="flex gap-2">
            {DAY_OFFSETS.map(({ label, offset }) => (
              <button key={offset} className={chip(activeDayOffset === offset)} onClick={() => handleDayToggle(offset)}>
                {label}
              </button>
            ))}
          </div>

          {/* Time selects — two <select> elements never overflow on iOS */}
          <div className="flex items-center gap-2">
            <select
              value={activeHour}
              onChange={e => handleHourChange(e.target.value)}
              className="flex-1 text-base border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">HH</option>
              {Array.from({ length: 24 }, (_, i) => {
                const v = String(i).padStart(2, '0')
                return <option key={v} value={v}>{v}</option>
              })}
            </select>
            <span className="text-stone-400 dark:text-stone-500 font-semibold select-none">:</span>
            <select
              value={activeMinute}
              onChange={e => handleMinuteChange(e.target.value)}
              className="flex-1 text-base border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">MM</option>
              {['00', '15', '30', '45'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Summary / clear */}
          {anchor && startDatetime && finishDatetime ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {format(new Date(startDatetime), 'EEE HH:mm')}
                {' → '}
                {format(new Date(finishDatetime), 'EEE HH:mm')}
                {' '}({durationLabel})
              </span>
              <button
                onClick={() => onAnchorChange(null)}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline ml-4 flex-shrink-0"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Total estimated time:{' '}
              <strong className="text-stone-600 dark:text-stone-400">{durationLabel}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
