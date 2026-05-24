import { useState } from 'react'
import { format } from 'date-fns'

const RATING_STYLES = {
  poor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  ok: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  great: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

function StatChip({ label, value }) {
  return (
    <span className="inline-flex gap-1 text-xs text-stone-500 dark:text-stone-400">
      <span className="text-stone-400 dark:text-stone-500">{label}</span>
      <span className="font-medium text-stone-700 dark:text-stone-300">{value}</span>
    </span>
  )
}

function BakeEntry({ entry, steps, onDelete }) {
  const completedCount = entry.completedSteps?.length ?? 0
  const totalCount = steps?.length ?? 0

  const stepDurations = []
  if (steps && entry.stepCompletionTimes) {
    const times = entry.stepCompletionTimes
    const keys = Object.keys(times).map(Number).sort((a, b) => a - b)
    for (const idx of keys) {
      const prevKey = keys[keys.indexOf(idx) - 1]
      const start = prevKey != null ? times[prevKey] : null
      const end = times[idx]
      if (start != null && end > start) {
        const mins = Math.round((end - start) / 60000)
        const name = steps[idx]?.title ?? `Step ${idx + 1}`
        stepDurations.push({ name, mins })
      }
    }
  }

  return (
    <div className="py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${RATING_STYLES[entry.rating] ?? ''}`}>
            {entry.rating}
          </span>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-stone-300 hover:text-red-400 dark:text-stone-600 dark:hover:text-red-500 text-base leading-none"
            aria-label="Delete entry"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <StatChip label="qty" value={`×${entry.loaves}`} />
        <StatChip label="room" value={`${entry.roomTemp}°C`} />
        <StatChip label="flour" value={`${entry.flourTemp}°C`} />
        <StatChip label="knead" value={`${entry.kneadDurationMin} min`} />
        <StatChip label="target" value={`${entry.targetDoughTemp}°C`} />
        <StatChip label="steps" value={`${completedCount}/${totalCount}`} />
      </div>
      {stepDurations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {stepDurations.map(({ name, mins }) => (
            <StatChip key={name} label={name} value={`${mins} min`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BakingHistory({ history, recipe, onDelete }) {
  const [open, setOpen] = useState(false)

  if (!history.length) return null

  return (
    <div className="mb-6 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/60 text-left"
      >
        <span className="font-medium text-stone-700 dark:text-stone-300">Baking History</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {history.length} {history.length === 1 ? 'bake' : 'bakes'} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="px-4 bg-white dark:bg-stone-900">
          {history.map(entry => (
            <BakeEntry key={entry.id} entry={entry} steps={recipe?.steps} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
