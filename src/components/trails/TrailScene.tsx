import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Trail } from '../../types/trail'
import { TrailPin } from './TrailPin'
import { formatDistance } from '../../utils/distance'

gsap.registerPlugin(ScrollTrigger)

const ITEM_HEIGHT = 340   // px between each trail pin
const START_OFFSET = 260  // px from top before first pin (header clearance)

// Distance thresholds in miles for depth markers
const DEPTH_THRESHOLDS_MILES = [6, 30, 120, 600, 3100]

function getDepthMarkerIndices(trails: Trail[]): Map<number, number> {
  const markers = new Map<number, number>() // index → distanceMiles
  DEPTH_THRESHOLDS_MILES.forEach(threshMiles => {
    const threshKm = threshMiles / 0.621371
    const idx = trails.findIndex(t => (t.distanceFromUser ?? 0) >= threshKm)
    if (idx > 0 && idx < trails.length && !markers.has(idx)) {
      markers.set(idx, threshMiles)
    }
  })
  return markers
}

interface TrailSceneProps {
  trails: Trail[]
  hikedIds: Set<string>
  onToggleHiked: (id: string) => void
}

export function TrailScene({ trails, hikedIds, onToggleHiked }: TrailSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null)

  // Total height of the scene container
  const totalHeight = START_OFFSET + trails.length * ITEM_HEIGHT + 500

  useEffect(() => {
    if (!sceneRef.current || !trails.length) return

    const ctx = gsap.context(() => {
      sceneRef.current!.querySelectorAll('.trail-pin').forEach((pin, i) => {
        const isRight = i % 2 === 1
        gsap.fromTo(
          pin,
          { opacity: 0, x: isRight ? 40 : -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: pin,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      })

      // Animate depth marker lines
      sceneRef.current!.querySelectorAll('.depth-marker-wrap').forEach(marker => {
        gsap.fromTo(
          marker,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.4,
            scrollTrigger: {
              trigger: marker,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      })
    }, sceneRef)

    return () => ctx.revert()
  }, [trails])

  const depthMarkers = getDepthMarkerIndices(trails)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
    <div
      ref={sceneRef}
      className="relative w-full"
      style={{ height: totalHeight }}
    >
      {trails.map((trail, i) => {
        const isRight = i % 2 === 1
        const topPos = START_OFFSET + i * ITEM_HEIGHT
        const depthMiles = depthMarkers.get(i)

        return (
          <div key={trail.id}>
            {/* Depth marker line — rendered just above this trail if it's a threshold crossing */}
            {depthMiles !== undefined && (
              <div
                className="depth-marker-wrap absolute left-0 right-0"
                style={{ top: topPos - 48 }}
              >
                <hr
                  className="depth-marker"
                  data-label={`~ ${formatDistance((depthMiles) / 0.621371)} from you`}
                />
              </div>
            )}

            {/* Trail pin */}
            <div
              className="absolute"
              style={{
                top: topPos,
                // Even: left side, Odd: right side
                left: isRight ? undefined : '6%',
                right: isRight ? '6%' : undefined,
              }}
            >
              <TrailPin
                trail={trail}
                isHiked={hikedIds.has(trail.id)}
                onToggleHiked={onToggleHiked}
                isRight={isRight}
              />
            </div>
          </div>
        )
      })}
    </div>
    </div>
  )
}
