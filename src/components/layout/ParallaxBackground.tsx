import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// A negative animation-delay of -(fraction * duration) starts the element
// already that fraction of the way through its drift, so with fractions
// spread evenly across [0,1) every cloud/bird begins at a different point
// across the sky instead of clustered at the left edge — and each keeps
// looping forever after that. `dir: 'reverse'` flips it to drift right-to-left.
function spreadDelay(duration: number, fraction: number) {
  return -(duration * fraction)
}

const CLOUDS = [
  { top: '4%', width: 130, duration: 20, fraction: 0.05, dir: 'normal', opacity: 0.9 },
  { top: '11%', width: 90, duration: 17, fraction: 0.2, dir: 'reverse', opacity: 0.85 },
  { top: '19%', width: 145, duration: 24, fraction: 0.35, dir: 'normal', opacity: 0.75 },
  { top: '27%', width: 80, duration: 15, fraction: 0.5, dir: 'reverse', opacity: 0.8 },
  { top: '8%', width: 115, duration: 22, fraction: 0.65, dir: 'normal', opacity: 0.65 },
  { top: '33%', width: 100, duration: 18, fraction: 0.78, dir: 'reverse', opacity: 0.7 },
  { top: '16%', width: 70, duration: 14, fraction: 0.9, dir: 'normal', opacity: 0.6 },
] as const

const BIRDS = [
  { top: '6%', duration: 10, fraction: 0.08, dir: 'normal' },
  { top: '14%', duration: 12, fraction: 0.24, dir: 'reverse' },
  { top: '22%', duration: 9, fraction: 0.4, dir: 'normal' },
  { top: '29%', duration: 13, fraction: 0.56, dir: 'reverse' },
  { top: '10%', duration: 11, fraction: 0.72, dir: 'normal' },
  { top: '18%', duration: 14, fraction: 0.88, dir: 'reverse' },
] as const

const PARTICLES = [
  { left: '6%', size: 5, duration: 9, delay: -1 },
  { left: '14%', size: 3, duration: 12, delay: -4 },
  { left: '23%', size: 4, duration: 8, delay: -6 },
  { left: '31%', size: 6, duration: 11, delay: -2 },
  { left: '40%', size: 3, duration: 10, delay: -8 },
  { left: '48%', size: 5, duration: 13, delay: -3 },
  { left: '57%', size: 4, duration: 9, delay: -7 },
  { left: '65%', size: 3, duration: 11, delay: -5 },
  { left: '73%', size: 6, duration: 8, delay: -1 },
  { left: '81%', size: 4, duration: 12, delay: -9 },
  { left: '89%', size: 5, duration: 10, delay: -6 },
  { left: '95%', size: 3, duration: 9, delay: -3 },
]

// Sun glow colors: warm daylight yellow → deep sunset orange-red as it sets.
const SUN_DAY = { core: [255, 243, 196], mid: [255, 221, 115], glow: [255, 221, 115] }
const SUN_DUSK = { core: [255, 214, 168], mid: [255, 122, 74], glow: [255, 90, 60] }

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function lerpRgb(a: number[], b: number[], t: number) {
  return `rgb(${lerp(a[0], b[0], t)},${lerp(a[1], b[1], t)},${lerp(a[2], b[2], t)})`
}

function Cloud({ width, opacity }: { width: number; opacity: number }) {
  const h = width * 0.42
  return (
    <svg width={width} height={h} viewBox="0 0 100 42" style={{ opacity }}>
      <ellipse cx="30" cy="26" rx="26" ry="14" fill="#FFFFFF" />
      <ellipse cx="55" cy="18" rx="24" ry="17" fill="#FFFFFF" />
      <ellipse cx="76" cy="27" rx="18" ry="12" fill="#FFFFFF" />
      <ellipse cx="18" cy="30" rx="15" ry="10" fill="#FFFFFF" />
    </svg>
  )
}

function Bird() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12">
      <path
        d="M1,8 Q6,0 11,7 Q16,0 21,8"
        stroke="#3A2E22"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ParallaxBackground() {
  const mtnFarRef = useRef<HTMLDivElement>(null)
  const mtnMidRef = useRef<HTMLDivElement>(null)
  const treesFgRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLDivElement>(null)
  const duskRef = useRef<HTMLDivElement>(null)
  const sunRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax layers — foreground trees move fastest (closest to viewer)
      const layers = [
        { ref: mtnFarRef, rate: -0.12 },
        { ref: mtnMidRef, rate: -0.25 },
        { ref: groundRef, rate: -0.45 },
        { ref: treesFgRef, rate: -0.7 },
      ]

      layers.forEach(({ ref, rate }) => {
        if (!ref.current) return
        gsap.to(ref.current, {
          y: () => window.innerHeight * rate * 2,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        })
      })

    })

    // Sunset: use a scroll listener (not GSAP ScrollTrigger) so it stays
    // correct even when trails load after mount and change page height.
    // The transition completes within ~1.4 viewport heights of scrolling —
    // regardless of how long the trail list is — so the sun visibly sets
    // and the sky reaches full sunset color within a natural scroll range.
    function onScroll() {
      const span = window.innerHeight * 1.4
      const progress = Math.min(window.scrollY / span, 1)

      if (duskRef.current) {
        duskRef.current.style.opacity = String(progress * 0.88)
      }
      if (sunRef.current) {
        // Sun sinks from high in the sky down behind the mountain horizon.
        sunRef.current.style.top = `${8 + progress * 50}%`
        const core = lerpRgb(SUN_DAY.core, SUN_DUSK.core, progress)
        const mid = lerpRgb(SUN_DAY.mid, SUN_DUSK.mid, progress)
        const glow = lerpRgb(SUN_DAY.glow, SUN_DUSK.glow, progress)
        sunRef.current.style.background = `radial-gradient(circle, ${core} 0%, ${mid} 45%, rgba(0,0,0,0) 75%)`
        sunRef.current.style.boxShadow = `0 0 70px 25px ${glow.replace('rgb', 'rgba').replace(')', ',0.45)')}`
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      ctx.revert()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Sky gradient — soft daytime, light blue into light yellow near the horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #7EC8F0 0%, #A8DDF0 40%, #FDE9B8 75%, #FCD9A0 100%)',
        }}
      />

      {/* Sun — sinks behind the mountains as you scroll */}
      <div
        ref={sunRef}
        className="bg-sun"
        style={{
          top: '8%',
          right: '14%',
          width: '90px',
          height: '90px',
          background:
            'radial-gradient(circle, #FFF3C4 0%, #FFDD73 45%, rgba(255,221,115,0) 75%)',
          boxShadow: '0 0 70px 25px rgba(255,221,115,0.45)',
        }}
      />

      {/* Drifting clouds — spread across the sky, continuously looping, some drifting each way */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="bg-cloud"
          style={{
            top: c.top,
            left: 0,
            animationDuration: `${c.duration}s`,
            animationDelay: `${spreadDelay(c.duration, c.fraction)}s`,
            animationDirection: c.dir,
          }}
        >
          <Cloud width={c.width} opacity={c.opacity} />
        </div>
      ))}

      {/* Gliding birds — spread across the sky, some flying each way */}
      {BIRDS.map((b, i) => (
        <div
          key={i}
          className="bg-bird"
          style={{
            top: b.top,
            left: 0,
            animationDuration: `${b.duration}s`,
            animationDelay: `${spreadDelay(b.duration, b.fraction)}s`,
            animationDirection: b.dir,
          }}
        >
          <Bird />
        </div>
      ))}

      {/* Sunset overlay — pink/orange/purple, fades in as you scroll */}
      <div
        ref={duskRef}
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #5B3FA0 0%, #C24B8C 32%, #FF8F5E 58%, #FFB27A 74%, #3A2660 92%, #1B1240 100%)',
          opacity: 0,
        }}
      />

      {/* Distant mountains */}
      <div
        ref={mtnFarRef}
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '55vh' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}silhouettes/mountain-far.svg`}
          alt=""
          className="w-full h-full object-bottom object-cover"
          style={{ transform: 'scaleX(1.1)' }}
        />
      </div>

      {/* Mid mountains */}
      <div
        ref={mtnMidRef}
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '50vh' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}silhouettes/mountain-mid.svg`}
          alt=""
          className="w-full h-full object-bottom object-cover"
          style={{ transform: 'scaleX(1.05)' }}
        />
      </div>

      {/* Ground */}
      <div
        ref={groundRef}
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '16vh' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}silhouettes/ground.svg`}
          alt=""
          className="w-full h-full object-bottom object-cover"
        />
      </div>

      {/* Foreground tree silhouettes — closest layer, fastest parallax */}
      <div
        ref={treesFgRef}
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '30vh' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}silhouettes/trees-far.svg`}
          alt=""
          className="w-full h-full object-bottom object-cover"
        />
      </div>

      {/* Floating sparkle particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="bg-particle"
          style={{
            left: p.left,
            bottom: '10%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
