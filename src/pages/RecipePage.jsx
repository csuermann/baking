import { useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getRecipeBySlug } from '../utils/parseRecipes'
import { scaleIngredients } from '../utils/scaling'
import { computeSchedule } from '../utils/schedule'
import useLocalStorage from '../hooks/useLocalStorage'
import LoafSelector from '../components/LoafSelector'
import WaterTempCalc from '../components/WaterTempCalc'
import SchedulePlanner from '../components/SchedulePlanner'
import IngredientsList from '../components/IngredientsList'
import StepList from '../components/StepList'

const PROGRESS_DEFAULTS = {
  scheduleAnchor: null,
  completedSteps: [],
  stepCompletionTimes: {},
  kneadDurationOverride: null,
}

export default function RecipePage() {
  const { slug } = useParams()
  const recipe = getRecipeBySlug(slug)

  const defaultProgress = { loaves: recipe?.defaultQuantity ?? 1, ...PROGRESS_DEFAULTS }
  const [progress, setProgress] = useLocalStorage(`baking-progress-${slug}`, defaultProgress)
  const [prefs, setPrefs] = useLocalStorage('baking-prefs', {
    roomTemp: 22,
    flourTemp: 20,
    risePerMin: 0.5,
  })

  const scaledIngredients = useMemo(
    () => recipe ? scaleIngredients(recipe.ingredients, recipe.flourBaseG, progress.loaves) : [],
    [recipe, progress.loaves]
  )

  const schedule = useMemo(
    () => recipe ? computeSchedule(recipe.steps, progress.scheduleAnchor, progress.stepCompletionTimes) : [],
    [recipe, progress.scheduleAnchor, progress.stepCompletionTimes]
  )

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 dark:text-stone-400 mb-4">Recipe not found.</p>
          <Link to="/" className="text-amber-600 hover:underline">← Back to recipes</Link>
        </div>
      </div>
    )
  }

  const toggleStep = index => {
    setProgress(prev => {
      const isCompleted = prev.completedSteps.includes(index)
      if (isCompleted) {
        const completedSteps = prev.completedSteps.filter(i => i !== index)
        const stepCompletionTimes = { ...prev.stepCompletionTimes }
        delete stepCompletionTimes[index]
        return { ...prev, completedSteps, stepCompletionTimes }
      }
      return {
        ...prev,
        completedSteps: [...prev.completedSteps, index],
        stepCompletionTimes: { ...prev.stepCompletionTimes, [index]: Date.now() },
      }
    })
  }

  const resetProgress = () => setProgress(defaultProgress)

  const handleTimerStart = useCallback((index, projectedEndMs) => {
    setProgress(prev => {
      if (prev.completedSteps.includes(index)) return prev
      return { ...prev, stepCompletionTimes: { ...prev.stepCompletionTimes, [index]: projectedEndMs } }
    })
  }, [])

  const handleTimerReset = useCallback(index => {
    setProgress(prev => {
      if (prev.completedSteps.includes(index)) return prev
      const times = { ...prev.stepCompletionTimes }
      delete times[index]
      return { ...prev, stepCompletionTimes: times }
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-amber-600 hover:underline mb-6 inline-block">
        ← All recipes
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">{recipe.title}</h1>
        {recipe.intro && (
          <div className="prose prose-stone dark:prose-invert text-stone-600 dark:text-stone-400 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.intro}</ReactMarkdown>
          </div>
        )}
      </header>

      <LoafSelector
        value={progress.loaves}
        onChange={loaves => setProgress(p => ({ ...p, loaves }))}
      />

      <SchedulePlanner
        steps={recipe.steps}
        anchor={progress.scheduleAnchor}
        onAnchorChange={anchor => setProgress(p => ({ ...p, scheduleAnchor: anchor }))}
      />

      <WaterTempCalc
        targetDoughTemp={recipe.targetDoughTemp}
        kneadDurationMin={progress.kneadDurationOverride ?? recipe.kneadDurationMin}
        onKneadDurationChange={v => setProgress(p => ({ ...p, kneadDurationOverride: v }))}
        prefs={prefs}
        onPrefsChange={updates => setPrefs(p => ({ ...p, ...updates }))}
      />

      <IngredientsList ingredients={scaledIngredients} loaves={progress.loaves} />

      <StepList
        steps={recipe.steps}
        schedule={schedule}
        completedSteps={progress.completedSteps}
        onToggleStep={toggleStep}
        slug={slug}
        onTimerStart={handleTimerStart}
        onTimerReset={handleTimerReset}
      />

      {progress.completedSteps.length > 0 && (
        <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
          <button
            onClick={resetProgress}
            className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline"
          >
            Reset progress
          </button>
        </div>
      )}
    </div>
  )
}
