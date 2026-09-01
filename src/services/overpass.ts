import type { Trail } from '../types/trail'
import { haversineKm } from '../utils/distance'
import { estimateTimeHours } from '../utils/timeEstimate'
import { calcWaterLiters, calcSnackSuggestion, calcBestSeason, calcCrowdedness } from '../utils/recommendations'
import { estimateAscentFeetBatch } from '../utils/elevation'

// Tried in order per request; the public overpass-api.de instance is frequently
// unreachable/rate-limited, and mirrors vary in uptime, so we fail over between them.
// (overpass.osm.ch was tested and excluded — it returned fast, valid-looking, but
// completely empty results because its own dataset was stale/broken.)
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const SEARCH_RADII_METERS = [20000, 50000]
const MIN_RESULTS_BEFORE_WIDENING = 5
const MAX_TRAILS = 30
const MAX_ELEVATION_SAMPLES = 12
const LOOP_CLOSURE_KM = 0.05
const OVERPASS_SERVER_TIMEOUT_SECONDS = 25
const FETCH_TIMEOUT_MS = 20000
const PAVED_SURFACES = 'paved|asphalt|concrete|concrete:plates|paving_stones|sett|cobblestone'

// OSM sometimes maps a sidewalk as a separate "path" way that inherits its parallel
// street's name (e.g. "Whiton Street", "5th Avenue North") — those aren't hiking trails.
const STREET_NAME_PATTERN = /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|highway|hwy|parkway|pkwy|place|pl)\.?\s*(north|south|east|west|n|s|e|w)?\.?$/i

const SAC_SCALE_DIFFICULTY: Record<string, Trail['difficulty']> = {
  hiking: 'easy',
  mountain_hiking: 'moderate',
  demanding_mountain_hiking: 'hard',
  alpine_hiking: 'hard',
  demanding_alpine_hiking: 'expert',
  difficult_alpine_hiking: 'expert',
}

interface OverpassPoint {
  lat: number
  lon: number
}

interface OverpassWay {
  id: number
  tags?: Record<string, string>
  geometry?: OverpassPoint[]
}

export async function fetchTrails(lat: number, lng: number, locationLabel: string): Promise<Trail[]> {
  let ways: Required<OverpassWay>[] = []

  for (const radius of SEARCH_RADII_METERS) {
    ways = await queryWays(lat, lng, radius)
    if (ways.length >= MIN_RESULTS_BEFORE_WIDENING) break
  }

  const samples = ways.map(w =>
    sampleEvenly(w.geometry, MAX_ELEVATION_SAMPLES).map(p => ({ lat: p.lat, lng: p.lon })),
  )
  const ascentFeetByTrail = await estimateAscentFeetBatch(samples)

  return ways.map((way, i) => buildTrail(way, ascentFeetByTrail[i], locationLabel))
}

async function queryWays(lat: number, lng: number, radiusMeters: number): Promise<Required<OverpassWay>[]> {
  // "path"/"bridleway" are trail-shaped by default; "footway" is usually a sidewalk, so
  // only count it when sac_scale explicitly marks it as a hiking route. "track" is
  // deliberately excluded — in practice it's dominated by named rural/farm access roads
  // (e.g. "Elm Street Alley"), not hiking trails, which drowned out real trails nearby.
  // Paved surfaces are excluded to drop urban greenways/sidewalks mistagged as paths —
  // this also keeps the result set (and thus query cost) sane in dense metro areas.
  const query = `
    [out:json][timeout:${OVERPASS_SERVER_TIMEOUT_SECONDS}];
    (
      way["highway"~"^(path|bridleway)$"]["name"][!"surface"](around:${radiusMeters},${lat},${lng});
      way["highway"~"^(path|bridleway)$"]["name"]["surface"!~"^(${PAVED_SURFACES})$"](around:${radiusMeters},${lat},${lng});
      way["highway"="footway"]["name"]["sac_scale"](around:${radiusMeters},${lat},${lng});
    );
    out geom;
  `

  const data = await queryOverpass(query)

  const named = data.elements
    .filter((w): w is Required<OverpassWay> => !!w.tags?.name && !!w.geometry && w.geometry.length >= 2)
    .filter(w => !STREET_NAME_PATTERN.test(w.tags.name))

  return dedupeByName(named)
    .sort((a, b) =>
      haversineKm(lat, lng, a.geometry[0].lat, a.geometry[0].lon) -
      haversineKm(lat, lng, b.geometry[0].lat, b.geometry[0].lon),
    )
    .slice(0, MAX_TRAILS)
}

// OSM frequently maps one named trail as several adjoining "way" segments
// (e.g. a long trail split at road crossings), each with its own id but the
// same name — without this they'd show up as separate duplicate trail cards.
// Keep the longest segment per name as the trail's representative geometry.
function dedupeByName(ways: Required<OverpassWay>[]): Required<OverpassWay>[] {
  const byName = new Map<string, Required<OverpassWay>>()
  for (const way of ways) {
    const key = way.tags.name.trim().toLowerCase()
    const existing = byName.get(key)
    if (!existing || pathLengthKm(way.geometry) > pathLengthKm(existing.geometry)) {
      byName.set(key, way)
    }
  }
  return [...byName.values()]
}

async function queryOverpass(query: string): Promise<{ elements: OverpassWay[] }> {
  let lastError: unknown

  for (const url of OVERPASS_URLS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`${url} responded ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      console.warn(`Overpass mirror failed, trying next: ${url}`, err)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Overpass mirrors failed')
}

function buildTrail(way: Required<OverpassWay>, ascentFeet: number, locationLabel: string): Trail {
  const { geometry, tags } = way
  const lengthMiles = pathLengthKm(geometry) * 0.621371
  const mid = geometry[Math.floor(geometry.length / 2)]
  const difficulty = SAC_SCALE_DIFFICULTY[tags.sac_scale] ?? fallbackDifficulty(lengthMiles)
  const trailType = isLoop(geometry) ? 'loop' : 'out-and-back'
  const estimatedTimeHours = estimateTimeHours(lengthMiles, ascentFeet)

  return {
    id: `osm-${way.id}`,
    name: tags.name,
    location: locationLabel.split(',').slice(0, 2).join(','),
    lat: mid.lat,
    lng: mid.lon,
    difficulty,
    lengthMiles,
    ascentFeet: Math.round(ascentFeet),
    estimatedTimeHours,
    stars: 0,
    starVotes: 0,
    funLevel: 0,
    trailType,
    summary: tags.description,
    waterLiters: calcWaterLiters(lengthMiles, ascentFeet),
    snackSuggestion: calcSnackSuggestion(estimatedTimeHours, difficulty),
    bestSeason: calcBestSeason(mid.lat, ascentFeet + 2000),
    crowdedness: calcCrowdedness(0),
    source: 'osm',
  }
}

function fallbackDifficulty(lengthMiles: number): Trail['difficulty'] {
  if (lengthMiles < 2) return 'easy'
  if (lengthMiles < 5) return 'moderate'
  if (lengthMiles < 9) return 'hard'
  return 'expert'
}

function isLoop(geometry: OverpassPoint[]): boolean {
  const start = geometry[0]
  const end = geometry[geometry.length - 1]
  return haversineKm(start.lat, start.lon, end.lat, end.lon) < LOOP_CLOSURE_KM
}

function pathLengthKm(geometry: OverpassPoint[]): number {
  let total = 0
  for (let i = 1; i < geometry.length; i++) {
    total += haversineKm(geometry[i - 1].lat, geometry[i - 1].lon, geometry[i].lat, geometry[i].lon)
  }
  return total
}

function sampleEvenly<T>(arr: T[], maxCount: number): T[] {
  if (arr.length <= maxCount) return arr
  const step = (arr.length - 1) / (maxCount - 1)
  return Array.from({ length: maxCount }, (_, i) => arr[Math.round(i * step)])
}
