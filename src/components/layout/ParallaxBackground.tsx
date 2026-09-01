import { useEffect, useRef } from 'react'

// A negative animation-delay of -(fraction * duration) starts the element
// already that fraction of the way through its drift, so with fractions
// spread evenly across [0,1) every cloud/bird begins at a different point
// across the sky instead of clustered at the left edge — and each keeps
// looping forever after that. `dir: 'reverse'` flips it to drift right-to-left.
function spreadDelay(duration: number, fraction: number) {
  return -(duration * fraction)
}

const CLOUDS = [
  { top: '4%', width: 130, duration: 20, fraction: 0.05, dir: 'normal', opacity: 0.9, variant: 0 },
  { top: '11%', width: 90, duration: 17, fraction: 0.2, dir: 'reverse', opacity: 0.85, variant: 2 },
  { top: '19%', width: 145, duration: 24, fraction: 0.35, dir: 'normal', opacity: 0.75, variant: 1 },
  { top: '27%', width: 80, duration: 15, fraction: 0.5, dir: 'reverse', opacity: 0.8, variant: 3 },
  { top: '8%', width: 115, duration: 22, fraction: 0.65, dir: 'normal', opacity: 0.65, variant: 2 },
  { top: '33%', width: 100, duration: 18, fraction: 0.78, dir: 'reverse', opacity: 0.7, variant: 0 },
  { top: '16%', width: 70, duration: 14, fraction: 0.9, dir: 'normal', opacity: 0.6, variant: 1 },
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
  { left: '3%', bottom: '6%', size: 0.8, duration: 9, delay: -1 },
  { left: '9%', bottom: '13%', size: 0.5, duration: 12, delay: -4 },
  { left: '14%', bottom: '4%', size: 0.7, duration: 8, delay: -6 },
  { left: '19%', bottom: '10%', size: 0.5, duration: 11, delay: -5.5 },
  { left: '23%', bottom: '17%', size: 1, duration: 11, delay: -2 },
  { left: '28%', bottom: '7%', size: 0.5, duration: 10, delay: -8.5 },
  { left: '33%', bottom: '14%', size: 0.7, duration: 10, delay: -8 },
  { left: '38%', bottom: '5%', size: 0.5, duration: 12, delay: -3.5 },
  { left: '43%', bottom: '11%', size: 0.8, duration: 13, delay: -3 },
  { left: '48%', bottom: '18%', size: 0.5, duration: 9, delay: -6.5 },
  { left: '53%', bottom: '6%', size: 0.7, duration: 9, delay: -7 },
  { left: '58%', bottom: '15%', size: 0.5, duration: 11, delay: -1.5 },
  { left: '62%', bottom: '9%', size: 0.8, duration: 11, delay: -5 },
  { left: '67%', bottom: '16%', size: 0.5, duration: 8, delay: -4.5 },
  { left: '72%', bottom: '4%', size: 1, duration: 8, delay: -1 },
  { left: '77%', bottom: '12%', size: 0.5, duration: 10, delay: -9.5 },
  { left: '82%', bottom: '7%', size: 0.7, duration: 12, delay: -9 },
  { left: '86%', bottom: '19%', size: 0.5, duration: 9, delay: -2.5 },
  { left: '90%', bottom: '5%', size: 0.8, duration: 10, delay: -6 },
  { left: '94%', bottom: '13%', size: 0.5, duration: 9, delay: -3 },
  { left: '97%', bottom: '8%', size: 0.7, duration: 11, delay: -7.5 },
]

// ── Day/night cycle ──────────────────────────────────────────────────────
// The sky loops through a full day every CYCLE_VH viewport-heights of
// scroll, however long the page is — it never freezes at one time of day.
// Each stage is a 5-stop sky gradient (top → horizon); stages are placed at
// specific points in the [0,1) cycle and blended between neighbors.
type SkyStops = readonly [string, string, string, string, string]

const SKY_MORNING: SkyStops = ['#5E76C4', '#8FA3DE', '#F3AD7E', '#FCCB92', '#FFDFA8']
const SKY_DAY: SkyStops = ['#7EC8F0', '#93D3F0', '#A8DDF0', '#FDE9B8', '#FCD9A0']
const SKY_SUNSET: SkyStops = ['#5B3FA0', '#8A4499', '#C24B8C', '#FF8F5E', '#FFB27A']
const SKY_NIGHT: SkyStops = ['#0A0E28', '#12163E', '#1B1B48', '#241E48', '#191A38']

// Scroll position 0 lands at t=0 (full day — the sun starts at its zenith);
// the cycle then runs day → sunset → night → morning → day (wrapping) forever.
const DAY_CYCLE: { t: number; stops: SkyStops }[] = [
  { t: 0, stops: SKY_DAY },
  { t: 0.27, stops: SKY_SUNSET },
  { t: 0.5, stops: SKY_NIGHT },
  { t: 0.72, stops: SKY_MORNING },
  { t: 1, stops: SKY_DAY },
]

const STOP_OFFSETS = [0, 25, 50, 75, 100]
const CYCLE_VH = 10 // viewport-heights of scroll per full day/night cycle

// ── Mountain-layer parallax ──────────────────────────────────────────────
// Each layer drifts upward by a fraction of its OWN height (not the
// viewport's) — otherwise a short/fast layer like the ground strip gets
// pushed by a viewport-relative offset far larger than its own height and
// detaches from the bottom edge, revealing a gap and sliding into the
// middle of the screen on any long page (this happened for real: ground
// and the foreground trees are only 16vh/30vh tall, so a couple of
// viewport-heights of scroll was enough to shove them well above where
// they belonged). Bounding the shift to each layer's own height means it
// can never detach, no matter how long the trail list makes the page.
// The shift itself ramps up over the first PARALLAX_VH viewport-heights of
// scroll, then holds — parallax reads as a one-time "settling into the
// scene" cue, not something that needs to keep animating forever.
const PARALLAX_VH = 1.4
// Ground and the foreground trees both have shiftFraction 0 — they never
// move, staying glued to the exact viewport bottom. Ground being static is
// what closes the gap the other (still-shifting) layers would otherwise
// reveal at the very bottom edge; the trees are static because the user
// asked for the foreground trees specifically not to drift on scroll.
const PARALLAX_LAYERS = [
  { heightVh: 55, shiftFraction: 0.1 }, // far mountains
  { heightVh: 50, shiftFraction: 0.14 }, // mid mountains
  { heightVh: 16, shiftFraction: 0 }, // ground — bottom safety net, stays put
  { heightVh: 30, shiftFraction: 0 }, // foreground trees — stays put
] as const

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function lerpRgb(a: number[], b: number[], t: number) {
  return `rgb(${lerp(a[0], b[0], t)},${lerp(a[1], b[1], t)},${lerp(a[2], b[2], t)})`
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpHex(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return lerpRgb([ar, ag, ab], [br, bg, bb], t)
}

function skyGradientAt(t: number) {
  let seg = DAY_CYCLE[0]
  let next = DAY_CYCLE[1]
  for (let i = 0; i < DAY_CYCLE.length - 1; i++) {
    if (t >= DAY_CYCLE[i].t && t <= DAY_CYCLE[i + 1].t) {
      seg = DAY_CYCLE[i]
      next = DAY_CYCLE[i + 1]
      break
    }
  }
  const span = next.t - seg.t
  const local = span === 0 ? 0 : (t - seg.t) / span
  const stops = seg.stops.map((c, i) => lerpHex(c, next.stops[i], local))
  return `linear-gradient(to bottom, ${stops.map((c, i) => `${c} ${STOP_OFFSETS[i]}%`).join(', ')})`
}

// Sun glow colors: warm daylight yellow → deep sunset orange-red near the horizon.
const SUN_DAY = { core: [255, 243, 196], mid: [255, 221, 115], glow: [255, 221, 115] }
const SUN_HORIZON = { core: [255, 214, 168], mid: [255, 122, 74], glow: [255, 90, 60] }

// Moon glow colors: pale silvery-white overhead → warm "moonrise" tint near the horizon.
const MOON_NIGHT = { core: [255, 255, 255], mid: [220, 226, 242], glow: [200, 210, 235] }
const MOON_HORIZON = { core: [255, 238, 210], mid: [255, 205, 165], glow: [255, 185, 145] }

// Scattered star field — fixed positions across the upper sky; the whole group
// fades in/out with the night amount, and each star twinkles at its own pace.
const STARS = [
  { top: '4%', left: '8%', size: 4, duration: 3.2, fraction: 0.1 },
  { top: '9%', left: '18%', size: 5, duration: 4, fraction: 0.4 },
  { top: '3%', left: '28%', size: 4, duration: 3.6, fraction: 0.7 },
  { top: '14%', left: '36%', size: 4, duration: 2.8, fraction: 0.2 },
  { top: '6%', left: '45%', size: 5, duration: 4.4, fraction: 0.55 },
  { top: '20%', left: '52%', size: 4, duration: 3.4, fraction: 0.85 },
  { top: '11%', left: '60%', size: 4, duration: 3.8, fraction: 0.15 },
  { top: '4%', left: '68%', size: 5, duration: 3, fraction: 0.5 },
  { top: '17%', left: '76%', size: 4, duration: 4.2, fraction: 0.3 },
  { top: '8%', left: '84%', size: 4, duration: 3.6, fraction: 0.65 },
  { top: '15%', left: '92%', size: 5, duration: 2.9, fraction: 0.9 },
  { top: '24%', left: '12%', size: 4, duration: 3.9, fraction: 0.35 },
  { top: '29%', left: '24%', size: 4, duration: 3.3, fraction: 0.6 },
  { top: '26%', left: '41%', size: 5, duration: 4.1, fraction: 0.05 },
  { top: '33%', left: '58%', size: 4, duration: 3.5, fraction: 0.75 },
  { top: '27%', left: '72%', size: 4, duration: 3, fraction: 0.45 },
  { top: '31%', left: '88%', size: 4, duration: 3.7, fraction: 0.2 },
  { top: '38%', left: '33%', size: 4, duration: 4, fraction: 0.5 },
  { top: '2%', left: '96%', size: 4, duration: 3.3, fraction: 0.8 },
  { top: '36%', left: '6%', size: 4, duration: 3.8, fraction: 0.1 },
] as const

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

// Four distinct cloud silhouettes (not just the same shape resized) — each a
// different arrangement/count of lobes, all within the same 100×42 viewBox.
const CLOUD_SHAPES = [
  // 0: classic puffy cloud, 4 rounded lobes
  [
    { cx: 30, cy: 26, rx: 26, ry: 14 },
    { cx: 55, cy: 18, rx: 24, ry: 17 },
    { cx: 76, cy: 27, rx: 18, ry: 12 },
    { cx: 18, cy: 30, rx: 15, ry: 10 },
  ],
  // 1: long, flat, stretched-out cloud, 5 shallow lobes
  [
    { cx: 12, cy: 28, rx: 12, ry: 8 },
    { cx: 32, cy: 20, rx: 20, ry: 12 },
    { cx: 55, cy: 15, rx: 22, ry: 13 },
    { cx: 78, cy: 21, rx: 19, ry: 11 },
    { cx: 92, cy: 27, rx: 11, ry: 8 },
  ],
  // 2: small, round, compact cloud, 3 tight lobes
  [
    { cx: 38, cy: 22, rx: 22, ry: 15 },
    { cx: 60, cy: 25, rx: 17, ry: 12 },
    { cx: 22, cy: 27, rx: 13, ry: 9 },
  ],
  // 3: lumpy, asymmetric cloud, 5 uneven lobes
  [
    { cx: 22, cy: 29, rx: 18, ry: 10 },
    { cx: 44, cy: 13, rx: 15, ry: 13 },
    { cx: 64, cy: 23, rx: 21, ry: 12 },
    { cx: 84, cy: 30, rx: 11, ry: 7 },
    { cx: 8, cy: 21, rx: 8, ry: 7 },
  ],
] as const

function Cloud({ width, opacity, variant }: { width: number; opacity: number; variant: number }) {
  const h = width * 0.42
  const shape = CLOUD_SHAPES[variant] ?? CLOUD_SHAPES[0]
  return (
    <svg width={width} height={h} viewBox="0 0 100 42" style={{ opacity }}>
      {shape.map((e, i) => (
        <ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="#FFFFFF" />
      ))}
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

// A tapered, gently bent leg silhouette (thigh → knee bend → hoof), instead
// of a plain rectangle. `kick` shifts the hoof forward (+) or back (-) of
// the attach point so a front/back leg pair can be staggered mid-stride.
function legPath(x: number, topY: number, bottomY: number, width: number, kick: number) {
  const hw = width / 2
  const kneeY = topY + (bottomY - topY) * 0.55
  const kneeKick = kick * 0.35
  return [
    `M${x - hw},${topY}`,
    `L${x + hw},${topY}`,
    `L${x + hw + kneeKick},${kneeY}`,
    `L${x + kick + hw * 0.6},${bottomY}`,
    `L${x + kick - hw * 0.6},${bottomY}`,
    `L${x - hw + kneeKick},${kneeY}`,
    'Z',
  ].join(' ')
}

// Single deer silhouette, facing right (the direction it walks) — a
// continuous body/neck/head/antler outline rather than primitive shapes, so
// it reads as an actual deer rather than blocks. Front and back leg pairs
// are separate <g>s so CSS can swing them in opposite phase for a walking
// gait, independent of the outer wrapper's own translateX walk and the
// inner svg's own footstep bob — three separate elements/transforms, same
// trick as the bird's drift+flap, so none of them fight each other.
// Each leg gets its own pivot and swing phase — the two legs in a pair are
// half a cycle apart (opposite phase) so they alternate like a real stride
// instead of swinging forward/back together, and the four legs overall step
// 0/90/180/270 degrees apart for a natural walk sequence. `topY` sits well
// inside the torso outline (not right at its edge) so the leg's hidden
// upper portion is guaranteed to overlap the body fill — drawn before the
// torso, that overlap is what keeps every leg visually attached to it, even
// mid-swing.
const DEER_LEGS = [
  { x: 17, kick: -6, delay: 0 }, // back, trailing
  { x: 23, kick: 5, delay: -0.25 }, // back, leading
  { x: 55, kick: -3, delay: -0.125 }, // front, trailing
  { x: 61, kick: 6, delay: -0.375 }, // front, leading
] as const
const DEER_LEG_TOP_Y = 38
const DEER_LEG_BOTTOM_Y = 76
const DEER_FILL = '#241809'

function Deer() {
  return (
    <svg width="100%" height="100%" viewBox="0 -22 100 102" className="deer-bob">
      {/* Legs — each one independently phased, see DEER_LEGS above */}
      {DEER_LEGS.map((leg, i) => (
        <g
          key={i}
          className="deer-leg"
          style={{
            transformOrigin: `${leg.x}px ${DEER_LEG_TOP_Y}px`,
            animationDelay: `${leg.delay}s`,
          }}
        >
          <path
            d={legPath(leg.x, DEER_LEG_TOP_Y, DEER_LEG_BOTTOM_Y, 5, leg.kick)}
            fill={DEER_FILL}
          />
        </g>
      ))}
      {/* Tail */}
      <polygon points="17,30 10,24 15,37" fill={DEER_FILL} />
      {/* Body + neck + head + snout, as one continuous outline so the head
          reads as attached to the body rather than a separate floating shape */}
      <path
        d="M14,34
           C16,28 18,24 20,22
           C26,20 30,19 36,19
           C42,19 47,20 52,20
           C55,18 57,17 60,15
           C63,12 65,10 67,8
           C69,6 70,4 72,2
           C75,1 78,1 80,2
           C84,4 87,6 89,9
           C92,12 94,14 95,16
           C93,18 91,19 89,20
           C86,19 83,18 81,18
           C78,20 75,23 73,25
           C70,28 67,31 65,33
           C65,37 64,40 64,44
           L52,49
           C46,50 38,51 30,50
           C25,49 20,48 17,47
           C15,44 14,38 14,34
           Z"
        fill={DEER_FILL}
      />
      {/* Ear */}
      <polygon points="72,2 67,-6 76,3" fill={DEER_FILL} />
      {/* Antlers */}
      <path
        d="M72,2 C70,-7 67,-15 62,-21 M66,-10 L60,-14 M73,1 C77,-8 81,-16 87,-21 M78,-10 L84,-15"
        stroke={DEER_FILL}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// Lying-down counterpart to Deer, shown at night in its place (crossfaded,
// see sleepAmount below) — same viewBox/fill so it sits in exactly the same
// spot at exactly the same scale. One continuous body+head outline resting
// low near the ground, legs tucked away entirely (nothing to animate), ears
// and antlers laid back instead of upright.
function DeerSleeping() {
  return (
    <svg width="100%" height="100%" viewBox="0 -22 100 102">
      {/* Tail */}
      <polygon points="17,60 11,55 15,66" fill={DEER_FILL} />
      {/* Body + neck + head, resting low with the head down near the ground */}
      <path
        d="M15,66
           C15,60 18,56 24,54
           C30,52 36,52 40,53
           C45,54 48,54 50,55
           C54,56 56,57 58,58
           C62,60 64,61 66,63
           C70,66 72,67 74,68
           C77,65 79,67 80,70
           C83,72 85,73 86,74
           C84,76 82,77 80,76
           C77,78 75,75 72,73
           C68,76 65,73 62,70
           C58,72 55,70 52,68
           C48,70 44,72 40,74
           C34,76 29,76 25,75
           C21,74 18,73 17,72
           C15,70 14,68 15,66
           Z"
        fill={DEER_FILL}
      />
      {/* Ear, laid back */}
      <polygon points="74,68 69,62 78,70" fill={DEER_FILL} />
      {/* Antlers, tilted back over the body instead of upright */}
      <path
        d="M74,68 C70,62 65,58 58,56 M67,60 L61,58 M75,67 C73,60 70,55 65,50 M70,57 L64,54"
        stroke={DEER_FILL}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export function ParallaxBackground() {
  const mtnFarRef = useRef<HTMLDivElement>(null)
  const mtnMidRef = useRef<HTMLDivElement>(null)
  const treesFgRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLDivElement>(null)
  const skyRef = useRef<HTMLDivElement>(null)
  const sunRef = useRef<HTMLDivElement>(null)
  const moonRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<HTMLDivElement>(null)
  const nightScrimRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const bgDeerRef = useRef<HTMLDivElement>(null)
  const deerStandingRef = useRef<HTMLDivElement>(null)
  const deerSleepingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parallaxRefs = [mtnFarRef, mtnMidRef, groundRef, treesFgRef]

    // A plain scroll listener (not GSAP ScrollTrigger) for everything here —
    // ScrollTrigger's 'bottom bottom' range depends on document height, which
    // changes once trails load, and previously made the parallax offsets
    // scale with the (potentially very long) page instead of the viewport.
    function onScroll() {
      const parallaxT = Math.min(window.scrollY / (window.innerHeight * PARALLAX_VH), 1)
      parallaxRefs.forEach((ref, i) => {
        if (!ref.current) return
        const { heightVh, shiftFraction } = PARALLAX_LAYERS[i]
        const maxShiftPx = (heightVh / 100) * window.innerHeight * shiftFraction
        ref.current.style.transform = `translateY(${-maxShiftPx * parallaxT}px)`
      })

      // Day/night cycle: `t` wraps every CYCLE_VH viewport-heights of scroll,
      // so the sky/sun keep cycling day → sunset → night → morning → day
      // for as long as the page scrolls, however many trails are listed.
      const cycleSpan = window.innerHeight * CYCLE_VH
      const t = ((window.scrollY / cycleSpan) % 1 + 1) % 1

      if (skyRef.current) {
        skyRef.current.style.background = skyGradientAt(t)
      }

      // Sun's position on its circular arc. `angle` is 0 at t=0 (the DAY
      // stage, zenith) and π at NIGHT (nadir, straight down/hidden) — no
      // phase shift needed since DAY_CYCLE now starts at DAY too. `height`
      // (cos) is the vertical component, `arc` (sin) the horizontal one;
      // using the same angle for both traces a true circle — overhead at
      // scroll 0, swinging right and down through sunset (angle > 0), under
      // and hidden through the night, then rising back up on the left
      // through the morning wrap (angle < 0 as it approaches 2π/0 again).
      const angle = 2 * Math.PI * t
      const height = Math.cos(angle)
      const arc = Math.sin(angle)

      if (sunRef.current) {
        const topPercent = 58 - height * 50
        const leftPercent = 50 + arc * 38
        // Foreground trees sit in the bottom 30vh (top ~70%+) and have gaps
        // between the pine shapes, so without this the sun/moon would still
        // be partly opaque as they cross behind that band and peek through
        // as a stray dot. Force fully transparent by top:68% — safely before
        // the tree line — instead of relying on the height-based fade alone.
        const horizonFade = clamp01((68 - topPercent) / 8)
        const opacity = clamp01(0.5 + height * 0.9) * horizonFade
        const colorT = clamp01((1 - height) / 1.3)
        const core = lerpRgb(SUN_DAY.core, SUN_HORIZON.core, colorT)
        const mid = lerpRgb(SUN_DAY.mid, SUN_HORIZON.mid, colorT)
        const glow = lerpRgb(SUN_DAY.glow, SUN_HORIZON.glow, colorT)
        sunRef.current.style.top = `${topPercent}%`
        // calc(...) instead of a translateX transform, so it doesn't fight
        // with the bg-sun class's own transform: scale(...) pulse animation.
        sunRef.current.style.left = `calc(${leftPercent}% - 45px)`
        sunRef.current.style.opacity = String(opacity)
        sunRef.current.style.background = `radial-gradient(circle, ${core} 0%, ${mid} 45%, rgba(0,0,0,0) 75%)`
        sunRef.current.style.boxShadow = `0 0 70px 25px ${glow.replace('rgb', 'rgba').replace(')', ',0.45)')}`
      }

      // Moon arcs opposite the sun — up when the sun is down, and vice versa —
      // reusing the same circle, rotated half a turn (negate height and arc).
      const moonHeight = -height
      const moonArc = -arc

      if (moonRef.current) {
        const topPercent = 58 - moonHeight * 50
        const leftPercent = 50 + moonArc * 38
        const horizonFade = clamp01((68 - topPercent) / 8)
        const opacity = clamp01(0.5 + moonHeight * 0.9) * horizonFade
        const colorT = clamp01((1 - moonHeight) / 1.3)
        const core = lerpRgb(MOON_NIGHT.core, MOON_HORIZON.core, colorT)
        const mid = lerpRgb(MOON_NIGHT.mid, MOON_HORIZON.mid, colorT)
        const glow = lerpRgb(MOON_NIGHT.glow, MOON_HORIZON.glow, colorT)
        moonRef.current.style.top = `${topPercent}%`
        moonRef.current.style.left = `calc(${leftPercent}% - 30px)`
        moonRef.current.style.opacity = String(opacity)
        moonRef.current.style.background = `radial-gradient(circle, ${core} 0%, ${mid} 55%, rgba(0,0,0,0) 78%)`
        moonRef.current.style.boxShadow = `0 0 45px 14px ${glow.replace('rgb', 'rgba').replace(')', ',0.4)')}`
      }

      // Dim the mountains/trees/ground toward night, brighten back at dawn;
      // the same amount fades the star field in — stars "slowly appear" as
      // night falls and fade back out through dawn, driven by scroll like
      // everything else in the cycle.
      const nightAmount = clamp01(-height)
      if (nightScrimRef.current) {
        nightScrimRef.current.style.opacity = String(nightAmount * 0.55)
      }
      if (starsRef.current) {
        starsRef.current.style.opacity = String(nightAmount)
      }
      // Fireflies only come out at night — same fade as the stars.
      if (particlesRef.current) {
        particlesRef.current.style.opacity = String(nightAmount)
      }
      // The deer doesn't vanish at night — it lies down and sleeps in place.
      // sleepAmount crossfades standing → lying over the middle of the
      // night ramp (not the full 0–1 range) so it's fully one pose or the
      // other for most of day/night, with a brief transition at dusk/dawn;
      // the walk itself pauses partway through that transition so it settles
      // to a stop instead of sliding to sleep.
      const sleepAmount = smoothstep(0.3, 0.7, nightAmount)
      if (deerStandingRef.current) {
        deerStandingRef.current.style.opacity = String(1 - sleepAmount)
      }
      if (deerSleepingRef.current) {
        deerSleepingRef.current.style.opacity = String(sleepAmount)
      }
      if (bgDeerRef.current) {
        bgDeerRef.current.style.animationPlayState = nightAmount > 0.5 ? 'paused' : 'running'
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Sky — cycles day → sunset → night → morning → day as you scroll */}
      <div
        ref={skyRef}
        className="absolute inset-0"
        style={{ background: skyGradientAt(0) }}
      />

      {/* Stars — fixed field across the upper sky, fades in/out with the night amount */}
      <div ref={starsRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {STARS.map((s, i) => (
          <div
            key={i}
            className="bg-star"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${spreadDelay(s.duration, s.fraction)}s`,
            }}
          />
        ))}
      </div>

      {/* Sun — starts centered overhead, arcs across the sky and sets/rises behind the mountains each cycle */}
      <div
        ref={sunRef}
        className="bg-sun"
        style={{
          top: '8%',
          left: 'calc(50% - 45px)',
          width: '90px',
          height: '90px',
          background:
            'radial-gradient(circle, #FFF3C4 0%, #FFDD73 45%, rgba(255,221,115,0) 75%)',
          boxShadow: '0 0 70px 25px rgba(255,221,115,0.45)',
        }}
      />

      {/* Moon — arcs opposite the sun, up through the night and hidden by day */}
      <div
        ref={moonRef}
        className="bg-moon"
        style={{
          top: '58%',
          left: 'calc(50% - 30px)',
          width: '60px',
          height: '60px',
          opacity: 0,
          background:
            'radial-gradient(circle, #FFFFFF 0%, #DCE2F2 55%, rgba(220,226,242,0) 78%)',
          boxShadow: '0 0 45px 14px rgba(200,210,235,0.4)',
        }}
      >
        <div style={{ position: 'absolute', top: '24%', left: '32%', width: '20%', height: '20%', borderRadius: '50%', background: 'rgba(150,160,190,0.35)' }} />
        <div style={{ position: 'absolute', top: '52%', left: '60%', width: '15%', height: '15%', borderRadius: '50%', background: 'rgba(150,160,190,0.3)' }} />
        <div style={{ position: 'absolute', top: '66%', left: '26%', width: '11%', height: '11%', borderRadius: '50%', background: 'rgba(150,160,190,0.3)' }} />
      </div>

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
          <Cloud width={c.width} opacity={c.opacity} variant={c.variant} />
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

      {/* Deer — walks along the ground line by day; the walk pauses and it
          crossfades to a lying-down sleeping pose at night (see sleepAmount
          above). The tree silhouettes render after it (below) so it passes
          behind trunks/canopies as it crosses. */}
      <div
        ref={bgDeerRef}
        className="bg-deer"
        style={{ bottom: '5%', left: 0, width: '110px', height: '78px' }}
      >
        <div ref={deerStandingRef} style={{ position: 'absolute', inset: 0, opacity: 1 }}>
          <Deer />
        </div>
        <div ref={deerSleepingRef} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <DeerSleeping />
        </div>
      </div>

      {/* Foreground tree silhouettes — closest layer, stays put on scroll */}
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

      {/* Night scrim over the landscape — dims toward night, brightens back at dawn */}
      <div
        ref={nightScrimRef}
        className="absolute inset-0"
        style={{ background: '#0A0E24', opacity: 0 }}
      />

      {/* Fireflies — only come out at night, fading in with the same nightAmount as the stars */}
      <div ref={particlesRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="bg-particle"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
