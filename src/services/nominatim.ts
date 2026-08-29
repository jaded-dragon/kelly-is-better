import type { CitySuggestion, NominatimResult, UserLocation } from '../types/trail'

const USER_AGENT = 'trail-finder/1.0 (janemeis1@gmail.com)'
const PLACE_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'borough', 'suburb'])

export async function geocodeLocation(query: string): Promise<UserLocation> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&accept-language=en`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error('Geocoding request failed')
  const results: NominatimResult[] = await res.json()
  if (!results.length) throw new Error(`No location found for "${query}"`)
  const { lat, lon, display_name } = results[0]
  return {
    query,
    lat: parseFloat(lat),
    lng: parseFloat(lon),
    displayName: display_name,
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

export async function searchCitySuggestions(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=6&countrycodes=us&addressdetails=1&accept-language=en`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  })
  if (!res.ok) throw new Error('Suggestion request failed')

  const results: NominatimPlaceResult[] = await res.json()
  const places = results.filter(r => PLACE_TYPES.has(r.addresstype ?? r.type))

  return (places.length ? places : results).map(r => ({
    id: `${r.osm_type}-${r.osm_id}`,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    name: r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.hamlet ?? r.display_name.split(',')[0],
    displayName: r.display_name,
  }))
}
