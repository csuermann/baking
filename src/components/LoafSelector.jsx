export default function LoafSelector({ value, onChange }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-sm text-stone-600 dark:text-stone-400">Quantity</span>
      <input
        type="number"
        min="1"
        value={value}
        onChange={e => {
          const n = parseInt(e.target.value, 10)
          if (n > 0) onChange(n)
        }}
        className="w-20 text-sm border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
      />
    </div>
  )
}
