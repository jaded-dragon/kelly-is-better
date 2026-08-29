import { useState, useEffect } from 'react'
import type { Trail, UserLocation } from '../types/trail'
import { fetchTrails } from '../services/overpass'
import { DEMO_TRAILS } from '../services/demoTrails'
import { haversineKm } from '../utils/distance'

interface TrailsState {
  trails: Trail[]
  loading: boolean
  error: string | null
  isDemo: boolean
}

export function useTrails(location: UserLocation | null) {
  const [state, setState] = useState<TrailsState>({ trails: [], loading: false, error: null, isDemo: false })

  useEffect(() => {
    if (!location) return

    setState({ trails: [], loading: true, error: null, isDemo: false })

    const controller = new AbortController()

    async function load() {
      let trails: Trail[]
      let isDemo = false

      try {
        trails = await fetchTrails(location!.lat, location!.lng, location!.displayName)
        if (trails.length === 0) throw new Error('No named trails found nearby')
      } catch (err) {
        // OSM has no coverage here, or the Overpass API is unreachable/rate-limited.
        console.warn('Falling back to demo trails:', err)
        trails = DEMO_TRAILS
        isDemo = true
      }

      const withDistance = trails
        .map(t => ({
          ...t,
          distanceFromUser: haversineKm(location!.lat, location!.lng, t.lat, t.lng),
        }))
        .sort((a, b) => (a.distanceFromUser ?? 0) - (b.distanceFromUser ?? 0))

      if (!controller.signal.aborted) {
        setState({ trails: withDistance, loading: false, error: null, isDemo })
      }
    }

    load()
    return () => controller.abort()
  }, [location])

  return state
}
