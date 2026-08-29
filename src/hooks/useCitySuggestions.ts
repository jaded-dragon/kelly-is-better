import { useState, useEffect } from 'react'
import type { CitySuggestion } from '../types/trail'
import { searchCitySuggestions } from '../services/nominatim'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2

export function useCitySuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])

  useEffect(() => {
    const trimmed = query.trim()
    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const results = await searchCitySuggestions(trimmed, controller.signal)
        if (!controller.signal.aborted) setSuggestions(results)
      } catch {
        if (!controller.signal.aborted) setSuggestions([])
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, enabled])

  return suggestions
}
