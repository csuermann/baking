import useDarkMode from '../hooks/useDarkMode'

export default function DarkModeToggle() {
  const [dark, setDark] = useDarkMode()

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-stone-400 transition-colors text-lg leading-none"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
