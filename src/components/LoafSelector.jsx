export default function LoafSelector({ value, onChange, onReset }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-sm text-stone-600 dark:text-stone-400">Quantity</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => { if (value > 1) onChange(value - 1) }}
          disabled={value <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-lg leading-none"
          aria-label="Decrease quantity"
        >−</button>
        <input
          type="number"
          min="1"
          value={value}
          onChange={e => { const n = parseInt(e.target.value, 10); if (n > 0) onChange(n) }}
          className="w-12 text-sm border border-stone-200 dark:border-stone-700 rounded-lg px-1 py-1.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-lg leading-none"
          aria-label="Increase quantity"
        >+</button>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="ml-auto text-sm text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}
