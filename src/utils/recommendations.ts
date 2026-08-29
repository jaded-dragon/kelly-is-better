import type { Trail } from '../types/trail'

export function calcWaterLiters(lengthMiles: number, ascentFeet: number): number {
  let water = lengthMiles * 0.5
  if (ascentFeet > 2000) water += 0.5
  if (ascentFeet > 4000) water += 0.5
  water = Math.max(water, 1.0)
  return Math.round(water * 2) / 2  // round to nearest 0.5
}

export function calcSnackSuggestion(estimatedTimeHours: number, difficulty: Trail['difficulty']): string {
  let base: string
  if (estimatedTimeHours < 2) {
    base = 'Granola bar or piece of fruit'
  } else if (estimatedTimeHours < 4) {
    base = 'Trail mix, 2 energy bars, fruit'
  } else if (estimatedTimeHours < 6) {
    base = 'Full lunch + 2 snacks (nuts, jerky, bars)'
  } else {
    base = 'Full lunch, 3–4 snacks, emergency rations'
  }
  if (difficulty === 'expert') base += ' + electrolyte tablets'
  return base
}

export function calcBestSeason(lat: number, elevationFt: number): string {
  if (elevationFt > 8000 && lat > 35) return 'June – September'
  if (lat >= 25 && lat <= 35 && elevationFt < 4000) return 'October – April'
  if (lat > 45 && elevationFt < 6000) return 'May – October'
  if (elevationFt > 10000) return 'July – September'
  return 'Year-round (check conditions)'
}

export function calcCrowdedness(starVotes: number): Trail['crowdedness'] {
  if (starVotes > 200) return 'high'
  if (starVotes > 50) return 'moderate'
  return 'low'
}

const CROWDEDNESS_LABELS = { low: 'Quiet', moderate: 'Moderate', high: 'Popular' } as const

export function crowdednessLabel(c: Trail['crowdedness']): string {
  return CROWDEDNESS_LABELS[c]
}
