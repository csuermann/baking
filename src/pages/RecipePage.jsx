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
import RateBake from '../components/RateBake'
import BakingHistory from '../components/BakingHistory'

const PROGRESS_DEFAULTS = {
  scheduleAnchor: null,
  completedSteps: [],
  stepCompletionTimes: {},
  stepActivatedAt: {},
  stepDurationOverrides: {},
  kneadDurationOverride: null,
  hasRated: false,
}

export default function RecipePage() {
  const { slug } = useParams()
  const recipe = getRecipeBySlug(slug)

  const defaultProgress = { loaves: recipe?.defaultQuantity ?? 1, ...PROGRESS_DEFAULTS }
  const [progress, setProgress] = useLocalStorage(`baking-progress-${slug}`, defaultProgress)
  const [history, setHistory] = useLocalStorage(`baking-history-${slug}`, [])
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
    () => recipe ? computeSchedule(recipe.steps, progress.scheduleAnchor, progress.stepCompletionTimes, progress.stepDurationOverrides, progress.stepActivatedAt, progress.completedSteps) : [],
    [recipe, progress.scheduleAnchor, progress.stepCompletionTimes, progress.stepDurationOverrides, progress.stepActivatedAt, progress.completedSteps]
  )

  const handleStepDurationChange = useCallback((index, mins) => {
    setProgress(prev => {
      const stepDurationOverrides = { ...prev.stepDurationOverrides, [index]: mins }
      const stepCompletionTimes = { ...prev.stepCompletionTimes }
      if (!prev.completedSteps.includes(index)) {
        delete stepCompletionTimes[index]
      }
      return { ...prev, stepDurationOverrides, stepCompletionTimes }
    })
  }, [])

  const handleDeleteHistory = useCallback(id => {
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }, [setHistory])

  const handleRate = useCallback(rating => {
    const record = {
      id: Date.now(),
      timestamp: Date.now(),
      rating,
      loaves: progress.loaves,
      roomTemp: prefs.roomTemp,
      flourTemp: prefs.flourTemp,
      risePerMin: prefs.risePerMin,
      kneadDurationMin: progress.kneadDurationOverride ?? recipe?.kneadDurationMin,
      targetDoughTemp: recipe?.targetDoughTemp,
      scheduleAnchor: progress.scheduleAnchor,
      completedSteps: progress.completedSteps,
      stepCompletionTimes: progress.stepCompletionTimes,
      stepActivatedAt: progress.stepActivatedAt,
    }
    setHistory(prev => [record, ...prev])
    setProgress(prev => ({ ...prev, hasRated: true }))
  }, [progress, prefs, recipe, setHistory])

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
      const stepsCount = recipe.steps.length

      if (isCompleted) {
        const completedSteps = prev.completedSteps.filter(i => i !== index)
        const stepCompletionTimes = { ...prev.stepCompletionTimes }
        delete stepCompletionTimes[index]
        const now = Date.now()
        const stepActivatedAt = { ...prev.stepActivatedAt }
        // Restart this step's clock from now.
        stepActivatedAt[index] = now
        // Clear activation for every subsequent step that is not yet completed —
        // completed steps keep their timing data for history.
        for (let j = index + 1; j < stepsCount; j++) {
          if (!completedSteps.includes(j)) delete stepActivatedAt[j]
        }
        return { ...prev, completedSteps, stepCompletionTimes, stepActivatedAt }
      }

      const now = Date.now()
      const completedSteps = [...prev.completedSteps, index]
      const stepActivatedAt = { ...prev.stepActivatedAt }
      // Activate the first subsequent step whose entire prerequisite chain is now done.
      // Skip over steps that are already activated or already completed (parallel work).
      for (let j = index + 1; j < stepsCount; j++) {
        if (stepActivatedAt[j] != null) {
          // Already has a timer — if not done yet it blocks activation of j+1.
          if (!completedSteps.includes(j)) break
          continue
        }
        if (completedSteps.includes(j)) continue // completed without a timer, keep scanning
        const allPrevDone = Array.from({ length: j }, (_, k) => k)
          .every(k => completedSteps.includes(k))
        if (allPrevDone) { stepActivatedAt[j] = now; break }
        break // missing a prerequisite — nothing further can be activated
      }
      return {
        ...prev,
        completedSteps,
        stepCompletionTimes: { ...prev.stepCompletionTimes, [index]: now },
        stepActivatedAt,
      }
    })
  }

  const resetProgress = () => {
    setProgress(defaultProgress)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">

        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">{recipe.title}</h1>
        {recipe.intro && (
          <div className="prose prose-stone dark:prose-invert text-stone-600 dark:text-stone-400 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.intro}</ReactMarkdown>
          </div>
        )}
      </header>

      <div className="mb-6 flex justify-end">
        <button
          onClick={resetProgress}
          className="text-sm text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      </div>

      <SchedulePlanner
        steps={recipe.steps}
        stepDurationOverrides={progress.stepDurationOverrides}
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

      <div className="mb-2 flex items-center gap-3">
        <span className="text-sm text-stone-600 dark:text-stone-400">Quantity</span>
        <LoafSelector
          value={progress.loaves}
          onChange={loaves => setProgress(p => ({ ...p, loaves }))}
        />
      </div>

      <IngredientsList ingredients={scaledIngredients} loaves={progress.loaves} />

      {!progress.stepActivatedAt?.[0] && (
        <div className="mb-6">
          <button
            onClick={() => setProgress(prev => ({ ...prev, stepActivatedAt: { ...prev.stepActivatedAt, 0: Date.now() } }))}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
          >
            Start recipe
          </button>
        </div>
      )}

      <StepList
        steps={recipe.steps}
        schedule={schedule}
        completedSteps={progress.completedSteps}
        onToggleStep={toggleStep}
        stepDurationOverrides={progress.stepDurationOverrides}
        onStepDurationChange={handleStepDurationChange}
        stepActivatedAt={progress.stepActivatedAt}
        stepCompletionTimes={progress.stepCompletionTimes}
      />

      <BakingHistory history={history} recipe={recipe} onDelete={handleDeleteHistory} />

      {progress.completedSteps.includes(recipe.steps.length - 1) && (
        <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
          <RateBake onRate={handleRate} hasRated={progress.hasRated} />
        </div>
      )}
    </div>
  )
}
