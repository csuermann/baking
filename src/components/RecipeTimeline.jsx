import { useState, useEffect } from 'react'
import { format, startOfDay, addDays } from 'date-fns'
import { getDefaultDuration } from '../utils/schedule'

function getMidnightMarkers(start, end) {
  const markers = []
  if (!start || !end) return markers
  const totalMs = end - start
  if (totalMs <= 0) return markers
  const cursor = startOfDay(addDays(start, 1))
  while (cursor < end) {
    const offsetMs = cursor - start
    markers.push({
      pct: (offsetMs / totalMs) * 100,
      label: format(cursor, 'EEE'),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return markers
}

function scrollToStep(index) {
  const el = document.getElementById(`step-${index}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function fmtMins(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  return h > 0 ? `${h}h` : `${m}m`
}

export default function RecipeTimeline({ steps, schedule, stepDurationOverrides = {}, hasAnchor = false, onStepDurationChange }) {
  const [selectedIndex, setSelectedIndex] = useState(null)

  // Reset selection if steps change (e.g. recipe navigation)
  useEffect(() => { setSelectedIndex(null) }, [steps])

  if (!steps.length || !schedule.length) return null

  const effectiveDurations = steps.map((s, i) =>
    stepDurationOverrides[i] != null ? stepDurationOverrides[i] : getDefaultDuration(s)
  )
  const totalMinutes = effectiveDurations.reduce((a, b) => a + b, 0)
  if (totalMinutes === 0) return null

  const hasPassive = steps.some(s => s.isPassive)

  const recipeStart = schedule[0]?.startTime
  const recipeEnd = schedule[schedule.length - 1]?.endTime
  const midnightMarkers = hasAnchor && recipeStart && recipeEnd
    ? getMidnightMarkers(recipeStart, recipeEnd)
    : []

  return (
    <div className="mt-4 mb-1">
      {/* Wall-clock labels */}
      {hasAnchor && recipeStart && recipeEnd && (
        <div className="flex justify-between text-xs text-stone-500 mb-1 px-0.5">
          <span>{format(recipeStart, 'EEE HH:mm')}</span>
          <span>{format(recipeEnd, 'EEE HH:mm')}</span>
        </div>
      )}

      {/* Gantt bar */}
      <div className="relative">
        <div className="flex h-5 rounded overflow-hidden" style={{ minWidth: '200px' }}>
          {steps.map((step, i) => {
            const pct = (effectiveDurations[i] / totalMinutes) * 100
            const isPassive = step.isPassive ?? false
            const isVariable = step.isVariable && !isPassive
            const isAdjustable = isVariable && !!onStepDurationChange
            const isSelected = selectedIndex === i

            let colorClass = isPassive ? 'bg-stone-600' : 'bg-amber-500'
            if (isVariable) colorClass = 'bg-amber-400'

            const tip = hasAnchor && schedule[i]
              ? `${step.title} · ${format(schedule[i].startTime, 'HH:mm')}–${format(schedule[i].endTime, 'HH:mm')}`
              : step.title

            const handleClick = () => {
              if (isAdjustable) {
                setSelectedIndex(prev => prev === i ? null : i)
              } else {
                scrollToStep(i)
              }
            }

            return (
              <button
                key={i}
                title={tip}
                aria-label={tip}
                onClick={handleClick}
                className={`
                  ${colorClass}
                  h-full
                  hover:brightness-110
                  border-r border-stone-950/20 last:border-r-0
                  focus:outline-none
                  transition-[filter,box-shadow]
                  ${isAdjustable ? 'cursor-ew-resize' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-amber-300' : ''}
                `}
                style={{ width: `${pct}%`, minWidth: pct < 1 ? '3px' : undefined }}
              />
            )
          })}
        </div>

        {/* Midnight markers */}
        {midnightMarkers.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 h-5 pointer-events-none flex flex-col items-center"
            style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-full bg-stone-200/30" />
          </div>
        ))}
      </div>

      {/* Inline duration adjustment panel */}
      {selectedIndex != null && onStepDurationChange && (() => {
        const s = steps[selectedIndex]
        const currentMins = stepDurationOverrides[selectedIndex] ?? getDefaultDuration(s)
        return (
          <div className="mt-2 px-3 py-2.5 bg-stone-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-200 truncate">{s.title}</span>
              <button
                onClick={() => { scrollToStep(selectedIndex); setSelectedIndex(null) }}
                className="ml-3 flex-shrink-0 text-xs text-stone-400 hover:text-amber-400 transition-colors"
              >
                Go to step ↗
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 w-12 text-right flex-shrink-0">{fmtMins(s.durationMin)}</span>
              <input
                type="range"
                min={s.durationMin}
                max={s.durationMax}
                step={15}
                value={currentMins}
                onChange={e => onStepDurationChange(selectedIndex, Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="text-xs text-stone-500 w-12 flex-shrink-0">{fmtMins(s.durationMax)}</span>
            </div>
            <div className="text-center text-sm font-semibold text-amber-400 mt-1">
              {fmtMins(currentMins)}
            </div>
          </div>
        )
      })()}

      {/* Day labels below midnight markers */}
      {midnightMarkers.length > 0 && (
        <div className="relative h-4 mt-0.5">
          {midnightMarkers.map((m, i) => (
            <span
              key={i}
              className="absolute text-xs text-stone-500 -translate-x-1/2"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      {hasPassive && (
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" />
            Active
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-block w-3 h-3 rounded-sm bg-stone-600" />
            Hands-off
          </span>
        </div>
      )}
    </div>
  )
}
