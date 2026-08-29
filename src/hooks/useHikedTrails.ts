import { useState, useCallback } from 'react'

const STORAGE_KEY = 'hiked-trail-ids'

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveToStorage(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useHikedTrails() {
  const [hikedIds, setHikedIds] = useState<Set<string>>(loadFromStorage)

  const toggleHiked = useCallback((id: string) => {
    setHikedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveToStorage(next)
      return next
    })
  }, [])

  return { hikedIds, toggleHiked }
}
