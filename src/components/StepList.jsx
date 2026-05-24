import StepItem from './StepItem'

export default function StepList({ steps, schedule, completedSteps, onToggleStep, slug, onTimerStart, onTimerReset, stepDurationOverrides, onStepDurationChange }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-6">Steps</h2>
      {steps.map((step, index) => (
        <StepItem
          key={index}
          step={step}
          index={index}
          stepSchedule={schedule[index]}
          isCompleted={completedSteps.includes(index)}
          onToggle={onToggleStep}
          slug={slug}
          onTimerStart={onTimerStart}
          onTimerReset={onTimerReset}
          durationOverride={stepDurationOverrides?.[index]}
          onDurationChange={mins => onStepDurationChange(index, mins)}
        />
      ))}
    </section>
  )
}
