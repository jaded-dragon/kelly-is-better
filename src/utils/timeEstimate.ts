// Naismith's rule: 1 hr per 3 miles + 1 hr per 2000ft ascent
export function estimateTimeHours(lengthMiles: number, ascentFeet: number): number {
  return (lengthMiles / 3) + (ascentFeet / 2000)
}

export function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
