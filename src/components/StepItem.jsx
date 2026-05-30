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
  return step.isVariable ? `${fmtMins(step.durationMin)} – ${fmtMins(step.durationMax)}` : fmtMins(step.durationMin)
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  )
}

export default function StepItem({ step, index, stepSchedule, isCompleted, onToggle, durationOverride, onDurationChange, activatedAt, completedAt, recipeStarted }) {
  const isPassive = step.isPassive ?? false
  const [bodyOpen, setBodyOpen] = useState(false)
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

  const borderClass = isCompleted
    ? 'border-green-400 opacity-50'
    : isPassive
      ? 'border-stone-600'
      : 'border-amber-400'

  return (
    <div
      id={`step-${index}`}
      className={`border-l-2 pl-5 py-1 mb-8 transition-opacity ${borderClass}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon / checkbox */}
        {recipeStarted && (
          isPassive ? (
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-stone-500">
              <MoonIcon />
            </span>
          ) : (
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
          )
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
            <h3
              className={`font-semibold ${
                isCompleted
                  ? 'line-through text-stone-400 dark:text-stone-600'
                  : isPassive
                    ? 'text-stone-500 dark:text-stone-500'
                    : 'text-stone-800 dark:text-stone-200'
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
            {!isCompleted && !isPassive && actualLabel && activatedAt && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {actualLabel} elapsed
              </span>
            )}
          </div>

          {/* Body — passive: collapsed/expandable; active: always shown when not complete */}
          {isPassive ? (
            <>
              {step.body && (
                <button
                  onClick={() => setBodyOpen(o => !o)}
                  className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-500 hover:text-stone-300 dark:hover:text-stone-300 transition-colors mb-1"
                  aria-expanded={bodyOpen}
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${bodyOpen ? 'rotate-90' : ''}`}
                    viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {bodyOpen ? 'Hide details' : 'Show details'}
                </button>
              )}
              {bodyOpen && step.body && (
                <div className="prose prose-sm prose-stone dark:prose-invert max-w-none mb-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
                </div>
              )}
            </>
          ) : (
            !isCompleted && step.body && (
              <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
              </div>
            )
          )}

          {/* Countdown timer — active steps only */}
          {!isPassive && !isCompleted && hasTimer && (activatedAt != null || step.isVariable) && (
            <CountdownTimer
              elapsedMs={activatedAt != null ? now - activatedAt : null}
              intendedMs={effectiveDurationMs}
              durationMin={step.durationMin}
              durationMax={step.durationMax ?? step.durationMin}
              isVariable={step.isVariable}
              onIntendedChange={mins => onDurationChange(mins)}
            />
          )}

          {/* Schedule times */}
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

          {/* "Done, move on" button for passive uncompleted steps */}
          {isPassive && !isCompleted && recipeStarted && (
            <button
              onClick={() => onToggle(index)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-amber-400 transition-colors"
            >
              Done, move on
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
