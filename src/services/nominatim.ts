import type { CitySuggestion, NominatimResult, UserLocation } from '../types/trail'
import { generateQueryVariants } from '../utils/locationAbbreviations'

const USER_AGENT = 'trail-finder/1.0 (janemeis1@gmail.com)'
const PLACE_TYPES = new Set([
  'city', 'town', 'village', 'hamlet', 'municipality', 'borough', 'suburb',
  'county', 'state', 'administrative',
])
const RETRYABLE_STATUS = new Set([403, 429, 502, 503])
const SUGGESTION_LIMIT = 5

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// The public Nominatim instance rate-limits/blocks bursts of requests from one
// client, which reads as "nothing came up" even for a perfectly valid query
// (e.g. "Holmdel, NJ"). Retry transient failures once before giving up.
async function fetchNominatim(url: string, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal })
    if (res.ok || !RETRYABLE_STATUS.has(res.status) || attempt >= 1) return res
    await delay(1100)
  }
}

async function rawGeocode(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&accept-language=en`
  const res = await fetchNominatim(url)
  if (!res.ok) throw new Error('Geocoding request failed')
  return res.json()
}

// Nominatim does no fuzzy/typo matching itself — "holndel" returns nothing
// even though "holmdel" is a one-key-away miss. QWERTY_NEIGHBORS models a
// fat-finger slip (the physically adjacent keys for each letter), so we can
// generate plausible corrections and just ask Nominatim whether each one is
// real, instead of guessing blind. Only whole-alphabet neighbors are used —
// no dictionary of place names is available client-side — so this catches
// "wrong key" typos, not missing/extra letters, without matching everything
// the way a full edit-distance search would.
const QWERTY_NEIGHBORS: Record<string, string> = {
  q: 'wa', w: 'qeas', e: 'wrsd', r: 'etdf', t: 'ryfg', y: 'tugh', u: 'yihj',
  i: 'uojk', o: 'ipkl', p: 'ol', a: 'qwsz', s: 'awedzx', d: 'serfxc',
  f: 'drtgcv', g: 'ftyhvb', h: 'gyujbn', j: 'huikmn', k: 'jiolm', l: 'kop',
  z: 'asx', x: 'zsdc', c: 'xdfv', v: 'cfgb', b: 'vghn', n: 'bhjm', m: 'njk',
}

// Ordered so the cheapest, most common typo shapes (a single wrong key, a
// single swapped pair) are tried well before the pricier full-alphabet
// deletion sweep — capped overall so a typo that isn't found still fails
// fast rather than working through every remaining candidate.
function generateTypoVariants(query: string, max = 20): string[] {
  const variants: string[] = []
  const seen = new Set([query.toLowerCase()])

  function addCandidate(chars: string[]) {
    const candidate = chars.join('')
    const key = candidate.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    variants.push(candidate)
  }

  const chars = query.split('')

  // Single wrong key: swap each letter for one of its keyboard neighbors.
  for (let i = 0; i < chars.length; i++) {
    const lower = chars[i].toLowerCase()
    const neighbors = QWERTY_NEIGHBORS[lower]
    if (!neighbors) continue
    const isUpper = chars[i] !== lower
    for (const n of neighbors) {
      const next = chars.slice()
      next[i] = isUpper ? n.toUpperCase() : n
      addCandidate(next)
    }
  }

  // Single swapped pair: transpose each adjacent pair of letters.
  for (let i = 0; i < chars.length - 1; i++) {
    if (!/[a-z]/i.test(chars[i]) || !/[a-z]/i.test(chars[i + 1])) continue
    const next = chars.slice()
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    addCandidate(next)
  }

  // Single extra letter: drop each letter once.
  for (let i = 0; i < chars.length; i++) {
    if (!/[a-z]/i.test(chars[i])) continue
    addCandidate(chars.slice(0, i).concat(chars.slice(i + 1)))
  }

  return variants.slice(0, max)
}

export async function geocodeLocation(query: string): Promise<UserLocation> {
  const candidates = [query, ...generateQueryVariants(query)]
  let results: NominatimResult[] = []
  for (const candidate of candidates) {
    results = await rawGeocode(candidate)
    if (results.length) break
  }

  let correctedQuery: string | undefined
  if (!results.length) {
    for (const candidate of generateTypoVariants(query)) {
      results = await rawGeocode(candidate)
      if (results.length) {
        correctedQuery = results[0].display_name.split(',')[0]
        break
      }
    }
  }

  if (!results.length) throw new Error(`No location found for "${query}"`)
  const { lat, lon, display_name } = results[0]
  return {
    query,
    lat: parseFloat(lat),
    lng: parseFloat(lon),
    displayName: display_name,
    correctedQuery,
  }
}

interface NominatimPlaceResult {
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  type: string
  addresstype?: string
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    hamlet?: string
  }
}

async function rawCitySuggestions(query: string, signal?: AbortSignal): Promise<NominatimPlaceResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&countrycodes=us&addressdetails=1&accept-language=en`
  const res = await fetchNominatim(url, signal)
  if (!res.ok) throw new Error('Suggestion request failed')
  return res.json()
}

export async function searchCitySuggestions(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  let results = await rawCitySuggestions(query, signal)

  // Only one abbreviation fallback attempt here (not the full variant list) —
  // this fires on every keystroke, so keep it cheap.
  if (!results.length) {
    const [variant] = generateQueryVariants(query, 1)
    if (variant) results = await rawCitySuggestions(variant, signal)
  }

  const places = results.filter(r => PLACE_TYPES.has(r.addresstype ?? r.type))

  return (places.length ? places : results).slice(0, SUGGESTION_LIMIT).map(r => ({
    id: `${r.osm_type}-${r.osm_id}`,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    name: r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.hamlet ?? r.display_name.split(',')[0],
    displayName: r.display_name,
  }))
}
