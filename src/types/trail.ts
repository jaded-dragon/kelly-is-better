export interface Trail {
  id: string
  name: string
  location: string
  lat: number
  lng: number
  distanceFromUser?: number      // km, calculated client-side
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert'
  lengthMiles: number
  ascentFeet: number
  estimatedTimeHours: number     // Naismith's rule
  stars: number                  // 0–5, only populated for demo trails
  starVotes: number              // number of ratings
  funLevel: number               // stars * 2 → 0–10 scale
  trailType: 'loop' | 'out-and-back' | 'point-to-point'
  imgUrl?: string
  summary?: string
  url?: string
  // Derived
  waterLiters: number
  snackSuggestion: string
  bestSeason: string
  // From API or derived
  conditionStatus?: string
  conditionDetails?: string
  crowdedness: 'low' | 'moderate' | 'high'
  source: 'osm' | 'demo'
}

export interface UserLocation {
  query: string
  lat: number
  lng: number
  displayName: string
}

export interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export interface CitySuggestion {
  id: string
  lat: number
  lng: number
  name: string
  displayName: string
}
