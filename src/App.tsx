import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { ParallaxBackground } from './components/layout/ParallaxBackground'
import { TrailScene } from './components/trails/TrailScene'
import { LoadingState } from './components/ui/LoadingState'
import { EmptyState } from './components/ui/EmptyState'
import { ErrorBanner } from './components/ui/ErrorBanner'
import { SuggestionsDropdown } from './components/search/SuggestionsDropdown'
import { useGeocode } from './hooks/useGeocode'
import { useTrails } from './hooks/useTrails'
import { useHikedTrails } from './hooks/useHikedTrails'
import { useCitySuggestions } from './hooks/useCitySuggestions'
import type { CitySuggestion } from './types/trail'

export default function App() {
  const { location, loading: geoLoading, error: geoError, geocode, selectLocation } = useGeocode()
  const { trails, loading: trailsLoading, error: trailsError, isDemo } = useTrails(location)
  const { hikedIds, toggleHiked } = useHikedTrails()
  const [query, setQuery] = useState('')
  const [pastHero, setPastHero] = useState(false)
  const [activeInput, setActiveInput] = useState<'hero' | 'nav' | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const loading = geoLoading || trailsLoading
  const error = geoError || trailsError
  const suggestions = useCitySuggestions(query, activeInput !== null)

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.65)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll to results when a search completes
  useEffect(() => {
    if (location && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 180)
      return () => clearTimeout(timer)
    }
  }, [location])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) geocode(query.trim())
    setActiveInput(null)
  }

  function handleSelectSuggestion(s: CitySuggestion) {
    setQuery(s.name)
    selectLocation({ query: s.name, lat: s.lat, lng: s.lng, displayName: s.displayName })
    setActiveInput(null)
  }

  return (
    <>
      <ParallaxBackground />

      {/* ── Sticky nav — slides in after scrolling past hero ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(11,16,9,0.94)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 1px 20px rgba(0,0,0,0.4)',
          transform: pastHero ? 'translateY(0)' : 'translateY(-100%)',
          opacity: pastHero ? 1 : 0,
          pointerEvents: pastHero ? 'auto' : 'none',
          transition: 'transform 0.32s ease, opacity 0.32s ease',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
              <polygon points="16,3 1,29 31,29" fill="var(--forest)" />
              <polygon points="23,13 11,29 35,29" fill="var(--sage)" opacity="0.7" />
            </svg>
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--earth)' }}
            >
              Trail Finder
            </span>
          </div>
          <form onSubmit={handleSearch} className="flex-1" style={{ position: 'relative' }}>
            <div
              className="flex items-center rounded-full px-3.5 py-2 gap-2"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.15)',
              }}
            >
              <MapPin size={13} style={{ color: 'var(--sage)', flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setActiveInput('nav')}
                onBlur={() => setActiveInput(null)}
                placeholder="Search another location…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--earth)' }}
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center justify-center rounded-full w-6 h-6 shrink-0 transition-colors duration-150"
                style={{
                  background: query.trim() ? 'var(--forest)' : 'var(--moss)',
                  color: '#fff',
                  border: 'none',
                  cursor: query.trim() ? 'pointer' : 'default',
                }}
                aria-label="Search trails"
              >
                {loading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Search size={12} />}
              </button>
            </div>
            {activeInput === 'nav' && (
              <SuggestionsDropdown suggestions={suggestions} onSelect={handleSelectSuggestion} />
            )}
          </form>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section
        style={{
          position: 'relative',
          height: '100vh',
          minHeight: '600px',
        }}
      >
        {/* Soft warm glow near the horizon, blending into the illustrated mountains */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, rgba(90,60,20,0.1) 100%)',
          }}
        />

        {/* Minimal top nav in hero */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            zIndex: 2,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
            <polygon points="16,3 1,29 31,29" fill="#24304A" />
            <polygon points="23,13 11,29 35,29" fill="#3B6E4A" opacity="0.85" />
          </svg>
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#24304A',
              textShadow: '0 1px 8px rgba(255,255,255,0.4)',
            }}
          >
            Trail Finder
          </span>
        </div>

        {/* Centered hero content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 1.5rem',
            paddingTop: '3rem',
            zIndex: 2,
          }}
        >
          {/* Script line */}
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(1.4rem, 4vw, 2.1rem)',
              fontWeight: 600,
              color: '#2E4066',
              marginBottom: '0.1rem',
              lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(255,255,255,0.5)',
            }}
          >
            Find Your Next
          </p>

          {/* Bold title */}
          <h1
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(4.5rem, 15vw, 9.5rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 0.88,
              letterSpacing: '-0.03em',
              marginBottom: '2.75rem',
              WebkitTextStroke: '3px #24304A',
              textShadow: '0 10px 26px rgba(36,48,74,0.3)',
              paintOrder: 'stroke fill',
            }}
          >
            TRAIL.
          </h1>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '460px', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '9999px',
                padding: '0.55rem 0.55rem 0.55rem 1.2rem',
                gap: '0.6rem',
                background: 'rgba(30,20,55,0.38)',
                border: '1.5px solid rgba(255,255,255,0.45)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(42,27,84,0.35)',
              }}
            >
              <MapPin size={15} style={{ color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setActiveInput('hero')}
                onBlur={() => setActiveInput(null)}
                placeholder="Enter a city or place…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#ffffff',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  width: '2.25rem',
                  height: '2.25rem',
                  flexShrink: 0,
                  background: query.trim() ? 'var(--forest)' : 'rgba(255,255,255,0.22)',
                  color: '#fff',
                  border: 'none',
                  cursor: query.trim() && !loading ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                aria-label="Search trails"
              >
                {loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Search size={14} />}
              </button>
            </div>
            {activeInput === 'hero' && (
              <SuggestionsDropdown suggestions={suggestions} onSelect={handleSelectSuggestion} />
            )}
          </form>

          {/* Post-search count in hero */}
          {location && !loading && trails.length > 0 && (
            <p
              style={{
                marginTop: '1.5rem',
                color: '#2E4066',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 500,
                textShadow: '0 1px 8px rgba(255,255,255,0.4)',
              }}
            >
              {trails.length} trails found · scroll to explore ↓
            </p>
          )}
        </div>

        {/* Scroll hint at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'rgba(46,64,102,0.65)',
            zIndex: 2,
            cursor: location ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          onClick={() => location && resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <svg width="18" height="30" viewBox="0 0 24 40" fill="none" aria-hidden>
            <line x1="12" y1="2" x2="12" y2="26" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="5,20 12,28 19,20" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          {!location && !loading && (
            <span
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              search to discover
            </span>
          )}
        </div>
      </section>

      {/* ── Results section ── */}
      {(location || loading || error) && (
        <div ref={resultsRef} style={{ position: 'relative', paddingTop: '3rem', paddingBottom: '4rem' }}>

          {/* Banners */}
          <div className="max-w-2xl mx-auto px-6 pt-2">
            {isDemo && !error && (
              <div
                className="px-4 py-3 rounded-xl text-xs text-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,136,152,0.35)',
                  color: 'var(--bark)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="font-medium" style={{ color: 'var(--earth)' }}>Sample trails only</span>
                {' '}— we couldn't find real trail data near this location, so these are not nearby.
              </div>
            )}
            {error && <ErrorBanner error={error} />}
            {loading && <div className="mt-4"><LoadingState /></div>}
            {!loading && !error && trails.length === 0 && location && (
              <EmptyState query={location.query} />
            )}
          </div>

          {/* Trail count label */}
          {!loading && !error && trails.length > 0 && (
            <p
              className="text-xs text-center mt-3 mb-1"
              style={{
                color: 'var(--bark)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              {trails.length} trails · nearest first · hover a dot for details
            </p>
          )}

          {/* Scene */}
          {!loading && !error && trails.length > 0 && (
            <TrailScene trails={trails} hikedIds={hikedIds} onToggleHiked={toggleHiked} />
          )}

          {/* Footer */}
          {!loading && !error && trails.length > 0 && (
            <div className="text-center pb-12">
              <p
                className="text-xs"
                style={{ color: 'var(--earth)', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                {hikedIds.size > 0 &&
                  `${hikedIds.size} trail${hikedIds.size === 1 ? '' : 's'} hiked · `}
                {isDemo ? 'Sample trail data' : 'Trail data from OpenStreetMap contributors'}
              </p>
              {location && (
                <p
                  className="text-xs mt-1"
                  style={{ color: 'rgba(236,231,223,0.8)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                >
                  Showing trails near{' '}
                  <span className="font-medium" style={{ color: 'var(--earth)' }}>
                    {location.displayName.split(',').slice(0, 2).join(',')}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
