import { useMemo } from 'react'
import { addMinutes, format } from 'date-fns'
import { getDefaultDuration, computeSchedule } from '../utils/schedule'
import RecipeTimeline from './RecipeTimeline'

const MAX_OFFSET_MINS = 72 * 60  // 72 hours ahead
const STEP_MINS = 15

// Floor current time to the nearest 15-min boundary so slider steps hit clean quarter-hours
function quarterFloor(date) {
  const d = new Date(date)
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0)
  return d
}

export default function SchedulePlanner({ steps, stepDurationOverrides = {}, anchor, onAnchorChange, onStepDurationChange }) {
  const totalMinutes = useMemo(
    () => steps.reduce((sum, s, i) => sum + (stepDurationOverrides[i] ?? getDefaultDuration(s)), 0),
    [steps, stepDurationOverrides]
  )
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  const durationLabel = m > 0 ? `${h}h ${m}m` : `${h}h`

  // Planned schedule — always a clean projection from the anchor, ignoring any
  // real activation/completion timestamps so the Gantt updates correctly as the
  // slider moves even when the recipe is already in progress.
  const plannedSchedule = useMemo(
    () => computeSchedule(steps, anchor, {}, stepDurationOverrides, {}, []),
    [steps, anchor, stepDurationOverrides]
  )

  // Slider value = minutes from the floored-now to start. Clamped to [0, MAX].
  const base = quarterFloor(new Date())
  const sliderValue = useMemo(() => {
    if (!anchor) return 0
    const diff = Math.round((new Date(anchor.datetime) - base) / 60000)
    return Math.max(0, Math.min(MAX_OFFSET_MINS, Math.round(diff / STEP_MINS) * STEP_MINS))
  }, [anchor])

  // Display times: use anchor if set, otherwise project from base
  const startDate = anchor ? new Date(anchor.datetime) : addMinutes(base, sliderValue)
  const endDate   = addMinutes(startDate, totalMinutes)
  const startLabel = (anchor && sliderValue > 0) ? format(startDate, 'EEE HH:mm') : 'Now'
  const endLabel   = format(endDate, 'EEE HH:mm')

  const handleChange = e => {
    const mins = Number(e.target.value)
    onAnchorChange({ type: 'start', datetime: format(addMinutes(quarterFloor(new Date()), mins), "yyyy-MM-dd'T'HH:mm") })
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">Schedule</h2>
        <span className="text-xs text-stone-400 dark:text-stone-500">{durationLabel} total</span>
      </div>

      {/* Start / End labels */}
      <div className="flex justify-between mb-3">
        <div>
          <div className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Start</div>
          <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">{startLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Est. end</div>
          <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">{endLabel}</div>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={MAX_OFFSET_MINS}
        step={STEP_MINS}
        value={sliderValue}
        onChange={handleChange}
        className="w-full accent-amber-500"
      />

      <div className="flex justify-between mt-1">
        <span className="text-xs text-stone-400 dark:text-stone-500">Now</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">+72 h</span>
      </div>

      <RecipeTimeline
        steps={steps}
        schedule={plannedSchedule}
        stepDurationOverrides={stepDurationOverrides}
        hasAnchor={anchor != null}
        onStepDurationChange={onStepDurationChange}
      />
    </div>
  )
}
