import { Link } from 'react-router-dom'

export default function RecipeCard({ recipe }) {
  const totalMinutes = recipe.steps.reduce(
    (sum, s) => sum + (s.durationMin + s.durationMax) / 2,
    0
  )
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  const durationLabel = mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`

  return (
    <Link
      to={`/recipe/${recipe.slug}`}
      className="block border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden bg-white dark:bg-stone-900 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all"
    >
      {recipe.thumbnail ? (
        <div className="aspect-video overflow-hidden">
          <img src={recipe.thumbnail} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center">
          <span className="text-5xl">🍞</span>
        </div>
      )}
      <div className="p-4">

        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{recipe.title}</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{recipe.description}</p>
        <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <span>{recipe.steps.length} steps</span>
          <span>{durationLabel}</span>
        </div>
      </div>
    </Link>
  )
}
