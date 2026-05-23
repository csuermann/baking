import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CountdownTimer from './CountdownTimer'

function fmtTime(date) {
  return date ? format(date, 'EEEE, HH:mm') : null
}

function fmtDuration(step) {
  if (step.durationMin === 0) return null
  const fmt = min => {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    return h > 0 ? `${h}h` : `${m}m`
  }
  return step.isVariable ? `${fmt(step.durationMin)}–${fmt(step.durationMax)}` : fmt(step.durationMin)
}

export default function StepItem({ step, index, stepSchedule, isCompleted, onToggle, slug, onTimerStart, onTimerReset }) {
  const timerKey = `timer-${slug}-${index}`
  const defaultDurationMs = ((step.durationMin + step.durationMax) / 2) * 60 * 1000
  const hasTimer = step.durationMin > 0

  const startLabel = stepSchedule ? fmtTime(stepSchedule.startTime) : null
  const endLabel = stepSchedule ? fmtTime(stepSchedule.endTime) : null
  const durationLabel = fmtDuration(step)

  return (
    <div
      className={`border-l-2 pl-5 py-1 mb-8 transition-opacity ${
        isCompleted ? 'border-green-400 opacity-50' : 'border-amber-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(index)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'border-green-400 bg-green-400'
              : 'border-stone-300 dark:border-stone-600 hover:border-amber-400'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
            <h3
              className={`font-semibold text-stone-800 dark:text-stone-200 ${
                isCompleted ? 'line-through text-stone-400 dark:text-stone-600' : ''
              }`}
            >
              {index + 1}. {step.title}
            </h3>
            {durationLabel && (
              <span className="text-xs text-stone-400 dark:text-stone-500">({durationLabel})</span>
            )}
          </div>

          {(startLabel || endLabel) && (
            <div className="text-xs text-stone-400 dark:text-stone-500 mb-2 flex flex-wrap gap-x-4">
              {startLabel && <span>Start: <span className="text-stone-500 dark:text-stone-400">{startLabel}</span></span>}
              {endLabel && (
                <span>
                  Est. end:{' '}
                  <span className="text-stone-500 dark:text-stone-400">
                    {step.isVariable ? `~${endLabel}` : endLabel}
                  </span>
                </span>
              )}
            </div>
          )}

          {!isCompleted && step.body && (
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
            </div>
          )}

          {!isCompleted && hasTimer && (
            <CountdownTimer
              timerKey={timerKey}
              durationMs={defaultDurationMs}
              onTimerStart={projectedEnd => onTimerStart?.(index, projectedEnd)}
              onTimerReset={() => onTimerReset?.(index)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
