import { useState, useCallback } from 'react'
import type { UserLocation } from '../types/trail'
import { geocodeLocation } from '../services/nominatim'

interface GeocodeState {
  location: UserLocation | null
  loading: boolean
  error: string | null
}

export function useGeocode() {
  const [state, setState] = useState<GeocodeState>({ location: null, loading: false, error: null })

  const geocode = useCallback(async (query: string) => {
    if (!query.trim()) return
    setState({ location: null, loading: true, error: null })
    try {
      const location = await geocodeLocation(query)
      setState({ location, loading: false, error: null })
    } catch (err) {
      setState({ location: null, loading: false, error: err instanceof Error ? err.message : 'Location not found' })
    }
  }, [])

  const selectLocation = useCallback((location: UserLocation) => {
    setState({ location, loading: false, error: null })
  }, [])

  return { ...state, geocode, selectLocation }
}
