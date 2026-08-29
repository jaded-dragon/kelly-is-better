import { haversineKm } from './distance'

const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup'
const FETCH_TIMEOUT_MS = 6000
const METERS_TO_FEET = 3.28084
const FALLBACK_FEET_PER_MILE = 150

interface Coord {
  lat: number
  lng: number
}

// Batches sampled points across all trails into a single request so ascent
// estimation costs one round trip, not one per trail, against the free public instance.
export async function estimateAscentFeetBatch(trailSamples: Coord[][]): Promise<number[]> {
  const flat = trailSamples.flat()
  if (flat.length === 0) return trailSamples.map(() => 0)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(OPEN_ELEVATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: flat.map(c => ({ latitude: c.lat, longitude: c.lng })) }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('elevation request failed')

    const data: { results: { elevation: number }[] } = await res.json()
    let offset = 0
    return trailSamples.map(samples => {
      const elevations = data.results.slice(offset, offset + samples.length).map(r => r.elevation)
      offset += samples.length
      return sumAscentMeters(elevations) * METERS_TO_FEET
    })
  } catch {
    return trailSamples.map(estimateAscentFallback)
  }
}

function sumAscentMeters(elevations: number[]): number {
  let gain = 0
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1]
    if (delta > 0) gain += delta
  }
  return gain
}

function estimateAscentFallback(samples: Coord[]): number {
  let km = 0
  for (let i = 1; i < samples.length; i++) {
    km += haversineKm(samples[i - 1].lat, samples[i - 1].lng, samples[i].lat, samples[i].lng)
  }
  return km * 0.621371 * FALLBACK_FEET_PER_MILE
}
