import { addMinutes, subMinutes } from 'date-fns'

export function getDefaultDuration(step) {
  return step.durationMin
}

export function computeSchedule(steps, anchor, stepCompletionTimes = {}, stepDurationOverrides = {}, stepActivatedAt = {}, completedSteps = []) {
  // An in-progress recipe implicitly anchors to its real wall-clock start even
  // without an explicit schedule anchor set by the user.
  const implicitStart = stepActivatedAt[0] != null ? new Date(stepActivatedAt[0]) : null

  if (!steps.length) return []

  const totalMinutes = steps.reduce((sum, s, i) =>
    sum + (stepDurationOverrides[i] != null ? stepDurationOverrides[i] : getDefaultDuration(s)), 0)

  let scheduleStart
  if (anchor) {
    if (anchor.type === 'finish') {
      scheduleStart = subMinutes(new Date(anchor.datetime), totalMinutes)
    } else {
      scheduleStart = new Date(anchor.datetime)
    }
  } else if (implicitStart) {
    // In-progress recipe: anchor to its real wall-clock start
    scheduleStart = implicitStart
  } else {
    // Nothing set yet: project forward from now so times are always visible
    scheduleStart = new Date()
  }

  const schedule = []
  let cursor = scheduleStart

  for (let i = 0; i < steps.length; i++) {
    const startTime = new Date(cursor)
    const dur = stepDurationOverrides[i] != null ? stepDurationOverrides[i] : getDefaultDuration(steps[i])
    let endTime

    if (completedSteps.includes(i) && stepCompletionTimes[i] != null) {
      // actual completion time recorded when step was checked off
      endTime = new Date(stepCompletionTimes[i])
    } else if (stepActivatedAt[i] != null) {
      // step is active: anchor end at real wall-clock start + intended duration
      endTime = addMinutes(new Date(stepActivatedAt[i]), dur)
    } else {
      // not yet started: project forward from cursor
      endTime = addMinutes(startTime, dur)
    }

    schedule.push({ startTime, endTime })
    cursor = endTime
  }

  return schedule
}
