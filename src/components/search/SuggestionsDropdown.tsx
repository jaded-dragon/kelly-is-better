import { MapPin } from 'lucide-react'
import type { CitySuggestion } from '../../types/trail'

interface SuggestionsDropdownProps {
  suggestions: CitySuggestion[]
  onSelect: (suggestion: CitySuggestion) => void
}

export function SuggestionsDropdown({ suggestions, onSelect }: SuggestionsDropdownProps) {
  if (suggestions.length === 0) return null

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 z-50 overflow-hidden rounded-2xl py-1"
      style={{
        top: 'calc(100% + 8px)',
        background: 'var(--cream)',
        border: '1px solid var(--moss)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      }}
    >
      {suggestions.map(s => (
        <li key={s.id} role="option" aria-selected={false}>
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault()
              onSelect(s)
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-black/5"
            style={{ color: 'var(--earth)' }}
          >
            <MapPin size={13} style={{ color: 'var(--sage)', flexShrink: 0 }} />
            <span className="truncate">{s.displayName}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
