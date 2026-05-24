import StepItem from './StepItem'

export default function StepList({ steps, schedule, completedSteps, onToggleStep, stepDurationOverrides, onStepDurationChange, stepActivatedAt, stepCompletionTimes }) {
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
          durationOverride={stepDurationOverrides?.[index]}
          onDurationChange={mins => onStepDurationChange(index, mins)}
          activatedAt={stepActivatedAt?.[index]}
          completedAt={completedSteps.includes(index) ? stepCompletionTimes?.[index] : undefined}
        />
      ))}
    </section>
  )
}
