import type { CitySuggestion } from '../../types/trail'

interface SuggestionsDropdownProps {
  suggestions: CitySuggestion[]
  onSelect: (suggestion: CitySuggestion) => void
  variant?: 'hero' | 'nav'
}

// Matches the glass background/border of each search pill exactly, so the
// dropdown reads as the bottom half of the same capsule extending open,
// not a separate floating panel. Radius here must match the corresponding
// pill's own open-state bottom radius in App.tsx.
const VARIANTS = {
  hero: {
    background: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.45)',
    text: 'rgba(255,255,255,0.96)',
    icon: 'rgba(255,255,255,0.85)',
    hover: 'rgba(255,255,255,0.14)',
    divider: 'rgba(255,255,255,0.18)',
    radius: 26,
  },
  nav: {
    background: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.15)',
    text: 'var(--earth)',
    icon: 'var(--sage)',
    hover: 'rgba(255,255,255,0.1)',
    divider: 'rgba(255,255,255,0.14)',
    radius: 18,
  },
} as const

export const DROPDOWN_RADIUS = { hero: VARIANTS.hero.radius, nav: VARIANTS.nav.radius }

export function SuggestionsDropdown({ suggestions, onSelect, variant = 'hero' }: SuggestionsDropdownProps) {
  if (suggestions.length === 0) return null
  const v = VARIANTS[variant]

  return (
    <ul
      role="listbox"
      className="dropdown-enter absolute left-0 right-0 z-50 overflow-hidden"
      style={{
        top: '100%',
        marginTop: '-1.5px',
        background: v.background,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1.5px solid ${v.border}`,
        borderTop: 'none',
        borderRadius: `0 0 ${v.radius}px ${v.radius}px`,
        boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
      }}
    >
      {suggestions.map((s, i) => (
        <li
          key={s.id}
          role="option"
          aria-selected={false}
          style={i > 0 ? { borderTop: `1px solid ${v.divider}` } : undefined}
        >
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault()
              onSelect(s)
            }}
            className="w-full flex items-center px-5 py-3.5 text-left transition-colors duration-100"
            style={{ color: v.text, fontSize: '1.02rem' }}
            onMouseEnter={e => (e.currentTarget.style.background = v.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="truncate">{s.displayName}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
