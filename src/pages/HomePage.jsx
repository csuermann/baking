import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { recipes } from '../utils/parseRecipes'
import useLocalStorage from '../hooks/useLocalStorage'

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
        <div className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
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
  const langs = useMemo(() => [...new Set(recipes.map(r => r.lang))].sort(), [])
  const [lang, setLang] = useLocalStorage('recipe-language', langs.includes('en') ? 'en' : langs[0])
  const visible = recipes.filter(r => r.lang === lang)

  const LANG_FLAGS = { de: '🇩🇪', en: '🇬🇧' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">Recipes</h1>
          {langs.length > 1 && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-stone-500 mr-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v1.293a1 1 0 0 1-.293.707L10 9.207V14a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 6 13v-3.793L1.293 4.5A1 1 0 0 1 1 3.793V2.5z"/>
              </svg>
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-lg px-1.5 py-0.5 rounded-md transition-colors ${
                    lang === l
                      ? 'bg-amber-500/15 ring-1 ring-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  aria-label={`Show ${l === 'de' ? 'German' : 'English'} recipes`}
                  aria-pressed={lang === l}
                >
                  {LANG_FLAGS[l] ?? l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-stone-500 dark:text-stone-400">Bake great things, one recipe at a time.</p>
      </div>
      {visible.length === 0 ? (
        <p className="text-stone-400 dark:text-stone-600 text-center py-16">No recipes yet.</p>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {visible.map(recipe => (
            <RecipeRow key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
