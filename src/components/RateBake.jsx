const RATINGS = [
  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 ring-red-300 dark:ring-red-700' },
  { value: 'ok', label: 'OK', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 ring-amber-300 dark:ring-amber-700' },
  { value: 'great', label: 'Great', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 ring-green-300 dark:ring-green-700' },
]

export default function RateBake({ onRate, hasRated }) {
  return (
    <div className="mb-4">
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
        {hasRated ? 'Bake recorded — reset progress to start a new one.' : 'How did the bake turn out?'}
      </p>
      <div className="flex justify-center gap-3">
        {RATINGS.map(({ value, label, color }) => (
          <button
            key={value}
            disabled={hasRated}
            onClick={() => onRate(value)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ring-1 ${color} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
