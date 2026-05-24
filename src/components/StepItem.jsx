import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CountdownTimer from './CountdownTimer'
import { getDefaultDuration } from '../utils/schedule'

function fmtTime(date) {
  return date ? format(date, 'EEEE, HH:mm') : null
}

function fmtMins(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  return h > 0 ? `${h}h` : `${m}m`
}

function fmtDuration(step) {
  if (step.durationMin === 0) return null
  return step.isVariable ? `${fmtMins(step.durationMin)} ... ${fmtMins(step.durationMax)}` : fmtMins(step.durationMin)
}

export default function StepItem({ step, index, stepSchedule, isCompleted, onToggle, durationOverride, onDurationChange, activatedAt, completedAt, recipeStarted }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!activatedAt || isCompleted) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activatedAt, isCompleted])

  const actualMs = isCompleted && activatedAt && completedAt
    ? completedAt - activatedAt
    : !isCompleted && activatedAt
      ? now - activatedAt
      : null
  const actualLabel = actualMs != null ? fmtMins(Math.round(actualMs / 60000)) : null
  const effectiveMins = durationOverride ?? getDefaultDuration(step)
  const effectiveDurationMs = effectiveMins * 60 * 1000
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
        {recipeStarted && (
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
        )}

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
            {isCompleted && actualLabel && (
              <span className="text-xs font-medium text-green-600 dark:text-green-500">
                took {actualLabel}
              </span>
            )}
          </div>

          {!isCompleted && step.body && (
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
            </div>
          )}

          {!isCompleted && hasTimer && (activatedAt != null || step.isVariable) && (
            <CountdownTimer
              elapsedMs={activatedAt != null ? now - activatedAt : null}
              intendedMs={effectiveDurationMs}
              durationMin={step.durationMin}
              durationMax={step.durationMax ?? step.durationMin}
              isVariable={step.isVariable}
              onIntendedChange={mins => onDurationChange(mins)}
            />
          )}

          {(startLabel || endLabel) && (
            <div className="text-sm text-stone-400 dark:text-stone-500 mt-2 flex justify-between">
              {startLabel
                ? <span>Start: <span className="text-stone-500 dark:text-stone-400">{startLabel}</span></span>
                : <span />}
              {endLabel && (
                <span>
                  Est. end:{' '}
                  <span className="text-stone-500 dark:text-stone-400">
                    {endLabel}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
