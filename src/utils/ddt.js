export function computeWaterTemp({ targetDoughTemp, roomTemp, flourTemp, risePerMin, kneadDurationMin }) {
  const frictionFactor = risePerMin * kneadDurationMin
  return (targetDoughTemp * 3) - roomTemp - flourTemp - frictionFactor
}
