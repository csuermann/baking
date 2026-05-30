import { format, startOfDay, addDays } from 'date-fns'
import { getDefaultDuration } from '../utils/schedule'

function getMidnightMarkers(start, end) {
  const markers = []
  if (!start || !end) return markers
  const totalMs = end - start
  if (totalMs <= 0) return markers
  // Walk from the first midnight after start to end
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

export default function RecipeTimeline({ steps, schedule, stepDurationOverrides = {}, hasAnchor = false }) {
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

            let colorClass = isPassive ? 'bg-stone-600' : 'bg-amber-500'
            if (isVariable) colorClass = 'bg-amber-400'

            const tip = hasAnchor && schedule[i]
              ? `${step.title} · ${format(schedule[i].startTime, 'HH:mm')}–${format(schedule[i].endTime, 'HH:mm')}`
              : step.title

            return (
              <button
                key={i}
                title={tip}
                aria-label={tip}
                onClick={() => scrollToStep(i)}
                className={`${colorClass} h-full hover:brightness-110 border-r border-stone-950/20 last:border-r-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 transition-[filter]`}
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
