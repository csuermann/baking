import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { recipes } from '../utils/parseRecipes'

function getHistory(slug) {
  try {
    return JSON.parse(localStorage.getItem(`baking-history-${slug}`) || '[]')
  } catch {
    return []
  }
}

function fmtDuration(steps) {
  const total = steps.reduce((sum, s) => sum + (s.durationMin + s.durationMax) / 2, 0)
  const h = Math.floor(total / 60)
  const m = Math.round(total % 60)
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

function RecipeRow({ recipe }) {
  const history = useMemo(() => getHistory(recipe.slug), [recipe.slug])
  const lastEntry = history[0] // newest first
  const bakeCount = history.length

  return (
    <Link
      to={`/recipe/${recipe.slug}`}
      className="flex items-center justify-between gap-4 py-4 group"
    >
      <div className="min-w-0">
        <div className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {recipe.title}
        </div>
        <div className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
          {recipe.description}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-stone-400 dark:text-stone-500">
          <span>{recipe.steps.length} steps</span>
          <span>{fmtDuration(recipe.steps)}</span>
          {bakeCount > 0 && (
            <>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className="text-stone-500 dark:text-stone-400">
                baked {bakeCount}×
              </span>
              <span className="text-stone-400 dark:text-stone-500">
                last {formatDistanceToNow(new Date(lastEntry.timestamp), { addSuffix: true })}
              </span>
            </>
          )}
        </div>
      </div>
      <svg
        className="flex-shrink-0 w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-400 dark:group-hover:text-amber-500 transition-colors"
        viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Sourdough Recipes</h1>
        <p className="text-stone-500 dark:text-stone-400">Bake great bread, one loaf at a time.</p>
      </div>
      {recipes.length === 0 ? (
        <p className="text-stone-400 dark:text-stone-600 text-center py-16">No recipes yet.</p>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {recipes.map(recipe => (
            <RecipeRow key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
