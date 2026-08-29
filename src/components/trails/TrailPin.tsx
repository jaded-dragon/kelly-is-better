import { useState, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Trail } from '../../types/trail'
import { TrailTooltip } from './TrailTooltip'
import { HikedCheckbox } from './HikedCheckbox'
import { DistanceTag } from './DistanceTag'

const DIFFICULTY_COLOR: Record<Trail['difficulty'], string> = {
  easy: '#56C878',
  moderate: '#C8965A',
  hard: '#D48898',
  expert: '#D04848',
}

interface TrailPinProps {
  trail: Trail
  isHiked: boolean
  onToggleHiked: (id: string) => void
}

export function TrailPin({ trail, isHiked, onToggleHiked }: TrailPinProps) {
  const [hovered, setHovered] = useState(false)
  const [tooltipBelow, setTooltipBelow] = useState(false)
  const pinRef = useRef<HTMLDivElement>(null)

  function handleMouseEnter() {
    if (pinRef.current) {
      const rect = pinRef.current.getBoundingClientRect()
      setTooltipBelow(rect.top < 380)
    }
    setHovered(true)
  }

  const dotColor = DIFFICULTY_COLOR[trail.difficulty]

  return (
    <div
      ref={pinRef}
      className="trail-pin relative flex items-center gap-0 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleMouseEnter}
      onBlur={() => setHovered(false)}
      style={{ cursor: 'default' }}
    >
      {/* Dot */}
      <div
        className="shrink-0 rounded-full transition-transform duration-150"
        style={{
          width: 10,
          height: 10,
          background: dotColor,
          boxShadow: hovered ? `0 0 0 4px ${dotColor}30` : 'none',
          transform: hovered ? 'scale(1.4)' : 'scale(1)',
          zIndex: 1,
        }}
        aria-hidden
      />

      {/* Connector line */}
      <div
        className="shrink-0 self-center"
        style={{
          width: 'clamp(24px, 6vw, 80px)',
          height: 0,
          borderTop: '1.5px dashed var(--moss)',
          opacity: hovered ? 0.9 : 0.45,
          transition: 'opacity 0.15s',
        }}
        aria-hidden
      />

      {/* Trail info */}
      <div className="flex items-center gap-3 pl-2">
        {/* Name + location */}
        <div className="min-w-0" style={{ maxWidth: 'min(42vw, 220px)' }}>
          <p
            className="font-medium whitespace-nowrap overflow-hidden transition-colors duration-150"
            title={trail.name}
            style={{
              color: hovered ? 'var(--forest)' : isHiked ? 'var(--sage)' : 'var(--earth)',
              fontSize: '0.95rem',
              textOverflow: 'ellipsis',
              textDecoration: hovered ? 'underline' : 'none',
              textDecorationColor: 'var(--moss)',
              textUnderlineOffset: '3px',
              opacity: isHiked ? 0.7 : 1,
            }}
          >
            {trail.name}
          </p>
          <p
            className="text-xs whitespace-nowrap overflow-hidden"
            title={trail.location}
            style={{ color: 'var(--bark)', opacity: isHiked ? 0.6 : 0.8, textOverflow: 'ellipsis' }}
          >
            {trail.location}
          </p>
        </div>

        {/* Distance badge */}
        <DistanceTag km={trail.distanceFromUser} />

        {/* External link — visible on hover */}
        {trail.url && hovered && (
          <a
            href={trail.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--sage)' }}
            aria-label={`Open ${trail.name} trail page`}
          >
            <ExternalLink size={12} />
          </a>
        )}

        {/* Hiked checkbox */}
        <HikedCheckbox
          trailId={trail.id}
          checked={isHiked}
          onToggle={onToggleHiked}
        />
      </div>

      {/* Tooltip */}
      {hovered && <TrailTooltip trail={trail} below={tooltipBelow} />}
    </div>
  )
}
