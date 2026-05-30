import { startOfDay, differenceInCalendarDays, format } from 'date-fns'
import StepItem from './StepItem'

function dayLabel(date) {
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()))
  const name = format(date, 'EEE d MMM')
  if (diff === 0) return `Today · ${name}`
  if (diff === 1) return `Tomorrow · ${name}`
  if (diff === -1) return `Yesterday · ${name}`
  return name
}

export default function StepList({ steps, schedule, anchor, completedSteps, onToggleStep, stepDurationOverrides, onStepDurationChange, stepActivatedAt, stepCompletionTimes }) {
  const recipeStarted = stepActivatedAt?.[0] != null

  // Build groups: when anchor is set, group steps by calendar day of their scheduled start
  const groups = (() => {
    if (!anchor || !schedule?.length) {
      return [{ label: null, items: steps.map((step, index) => ({ step, index })) }]
    }
    const result = []
    let currentLabel = null
    steps.forEach((step, index) => {
      const startTime = schedule[index]?.startTime
      const label = startTime ? dayLabel(startTime) : null
      if (label !== currentLabel) {
        result.push({ label, items: [] })
        currentLabel = label
      }
      result[result.length - 1].items.push({ step, index })
    })
    return result
  })()

  return (
    <section>
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-6">Steps</h2>
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="flex items-center gap-3 mb-5 mt-2 first:mt-0">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
          )}
          {group.items.map(({ step, index }) => (
            <StepItem
              key={index}
              step={step}
              index={index}
              stepSchedule={schedule[index]}
              isCompleted={completedSteps.includes(index)}
              onToggle={onToggleStep}
              durationOverride={stepDurationOverrides?.[index]}
              onDurationChange={mins => onStepDurationChange(index, mins)}
              activatedAt={stepActivatedAt?.[index]}
              completedAt={completedSteps.includes(index) ? stepCompletionTimes?.[index] : undefined}
              recipeStarted={recipeStarted}
            />
          ))}
        </div>
      ))}
    </section>
  )
}
