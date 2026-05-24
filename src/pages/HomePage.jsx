import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useRecipes } from '../hooks/useRecipes'
import useLocalStorage from '../hooks/useLocalStorage'

function getHistory(slug) {
  try {
    return JSON.parse(localStorage.getItem(`baking-history-${slug}`) || '[]')
  } catch {
    return []
  }
}

function getActiveStep(slug, steps) {
  try {
    const p = JSON.parse(localStorage.getItem(`baking-progress-${slug}`) || 'null')
    if (!p) return null
    for (let i = 0; i < steps.length; i++) {
      if (p.stepActivatedAt?.[i] != null && !p.completedSteps?.includes(i)) {
        const intendedMins = p.stepDurationOverrides?.[i] ?? steps[i].durationMin
        const endMs = p.stepActivatedAt[i] + intendedMins * 60_000
        return { index: i, title: steps[i].title, endMs }
      }
    }
  } catch {}
  return null
}

function fmtDiff(ms) {
  const totalMin = Math.ceil(Math.abs(ms) / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  return h > 0 ? `${h}h` : `${m}m`
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

  const activeStep = useMemo(() => getActiveStep(recipe.slug, recipe.steps), [recipe.slug, recipe.steps])
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!activeStep) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [!!activeStep]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-2 py-4 group">
      <Link
        to={`/recipe/${recipe.slug}`}
        className="flex items-center justify-between gap-4 flex-1 min-w-0"
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
          {activeStep && (() => {
            const remainingMs = activeStep.endMs - now
            const overdue = remainingMs <= 0
            return (
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${overdue ? 'text-red-500' : 'text-amber-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
                <span>{activeStep.title}</span>
                <span>·</span>
                <span>{overdue ? `${fmtDiff(remainingMs)} overdue` : `${fmtDiff(remainingMs)} left`}</span>
              </div>
            )
          })()}
        </div>
        <svg
          className="flex-shrink-0 w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-400 dark:group-hover:text-amber-500 transition-colors"
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      {recipe.isCustom && (
        <Link
          to={`/recipe/${recipe.slug}/edit`}
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0 p-1.5 text-stone-600 hover:text-amber-400 transition-colors"
          aria-label={`Edit ${recipe.title}`}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const recipes = useRecipes()
  const builtInLangs = useMemo(() => [...new Set(recipes.filter(r => !r.isCustom).map(r => r.lang))].sort(), [recipes])
  const [lang, setLang] = useLocalStorage('recipe-language', builtInLangs.includes('en') ? 'en' : builtInLangs[0])

  const builtInVisible = recipes.filter(r => !r.isCustom && r.lang === lang)
  const customRecipes = recipes.filter(r => r.isCustom)

  const LANG_FLAGS = { de: '🇩🇪', en: '🇬🇧' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">Recipes</h1>
          <div className="flex items-center gap-3">
            {builtInLangs.length > 1 && (
              <div className="flex items-center gap-1.5 border border-stone-700 rounded-md px-2 py-1">
                <svg className="w-2.5 h-2.5 text-stone-500 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v1.293a1 1 0 0 1-.293.707L10 9.207V14a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 6 13v-3.793L1.293 4.5A1 1 0 0 1 1 3.793V2.5z"/>
                </svg>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  className="text-lg bg-transparent border-none outline-none cursor-pointer appearance-none"
                  aria-label="Filter by language"
                >
                  {builtInLangs.map(l => (
                    <option key={l} value={l}>{LANG_FLAGS[l] ?? l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
            <Link
              to="/recipe/new"
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-400 border border-stone-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
              New
            </Link>
          </div>
        </div>
        <p className="text-stone-500 dark:text-stone-400">Bake great things, one recipe at a time.</p>
      </div>

      {customRecipes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">My recipes</h2>
          <div className="divide-y divide-stone-800">
            {customRecipes.map(recipe => (
              <RecipeRow key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {builtInVisible.length === 0 ? (
        <p className="text-stone-400 dark:text-stone-600 text-center py-16">No recipes yet.</p>
      ) : (
        <>
          {customRecipes.length > 0 && (
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Built-in</h2>
          )}
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {builtInVisible.map(recipe => (
              <RecipeRow key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
