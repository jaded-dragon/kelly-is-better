interface EmptyStateProps {
  query?: string
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="text-center py-16 space-y-4">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto opacity-40" aria-hidden>
        <polygon points="32,6 4,58 60,58" stroke="var(--sage)" strokeWidth="2" fill="none"/>
        <polygon points="44,28 22,58 66,58" stroke="var(--moss)" strokeWidth="1.5" fill="none"/>
      </svg>
      <p className="text-lg font-medium" style={{ color: 'var(--earth)' }}>
        No trails found
      </p>
      <p className="text-sm" style={{ color: 'var(--bark)' }}>
        {query ? `We couldn't find trails near "${query}". Try a different location.` : 'Try searching for a city, national park, or landmark.'}
      </p>
    </div>
  )
}
