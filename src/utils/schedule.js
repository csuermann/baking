import { addMinutes, subMinutes } from 'date-fns'

export function getDefaultDuration(step) {
  return (step.durationMin + step.durationMax) / 2
}

export function computeSchedule(steps, anchor, stepCompletionTimes = {}) {
  if (!anchor || !steps.length) return steps.map(() => null)

  const totalMinutes = steps.reduce((sum, s) => sum + getDefaultDuration(s), 0)

  let scheduleStart
  if (anchor.type === 'finish') {
    scheduleStart = subMinutes(new Date(anchor.datetime), totalMinutes)
  } else {
    scheduleStart = new Date(anchor.datetime)
  }

  const schedule = []
  let cursor = scheduleStart

  for (let i = 0; i < steps.length; i++) {
    const startTime = new Date(cursor)
    let endTime

    if (stepCompletionTimes[i] != null) {
      endTime = new Date(stepCompletionTimes[i])
    } else {
      endTime = addMinutes(startTime, getDefaultDuration(steps[i]))
    }

    schedule.push({ startTime, endTime })
    cursor = endTime
  }

  return schedule
}
