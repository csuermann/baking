const OPTIONS = [
  { value: 1, label: '1 loaf' },
  { value: 2, label: '2 loaves' },
  { value: 3, label: '3 loaves' },
]

export default function LoafSelector({ value, onChange }) {
  return (
    <div className="mb-6">
      <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
