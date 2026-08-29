import { Droplets, Clock, TrendingUp, Star, Calendar, PawPrint, AlertTriangle, Users, Activity, Info, Sandwich } from 'lucide-react'
import type { Trail } from '../../types/trail'
import { formatTime } from '../../utils/timeEstimate'
import { crowdednessLabel } from '../../utils/recommendations'

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: '#78E498', bg: '#0E2818' },
  moderate: { label: 'Moderate', color: '#D4A85A', bg: '#1E1608' },
  hard: { label: 'Hard', color: '#E89080', bg: '#22100C' },
  expert: { label: 'Expert', color: '#E86068', bg: '#1E080A' },
} as const

const TRAIL_TYPE_ICONS: Record<Trail['trailType'], string> = {
  'loop': '↺ Loop',
  'out-and-back': '↔ Out & Back',
  'point-to-point': '→ Point-to-Point',
}

const CROWD_ICONS = { low: '🌿', moderate: '🏃', high: '👥' } as const

interface TrailTooltipProps {
  trail: Trail
  below?: boolean
}

export function TrailTooltip({ trail, below = false }: TrailTooltipProps) {
  const diff = DIFFICULTY_CONFIG[trail.difficulty]

  return (
    <div
      className="tooltip-enter absolute z-50 rounded-2xl shadow-2xl overflow-hidden pointer-events-none"
      style={{
        background: 'var(--cream)',
        border: '1px solid var(--moss)',
        width: '20rem',
        maxWidth: '88vw',
        ...(below
          ? { top: 'calc(100% + 10px)', bottom: 'auto' }
          : { bottom: 'calc(100% + 10px)', top: 'auto' }),
        left: '50%',
        transform: 'translateX(-50%)',
        boxShadow: '0 8px 40px rgba(42,31,26,0.18)',
      }}
      role="tooltip"
    >
      {/* Difficulty header bar */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: diff.bg }}
      >
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: diff.color }}>
          {diff.label}
        </span>
        <span className="text-xs" style={{ color: diff.color }}>
          {TRAIL_TYPE_ICONS[trail.trailType]}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Tier 1: Decision critical */}
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={<Clock size={13}/>} label="Time" value={formatTime(trail.estimatedTimeHours)} />
          <Stat icon={<Activity size={13}/>} label="Distance" value={`${trail.lengthMiles.toFixed(1)} mi`} />
          <Stat icon={<TrendingUp size={13}/>} label="Elevation Gain" value={`${trail.ascentFeet.toLocaleString()} ft`} />
          <Stat
            icon={<Star size={13} style={{ fill: 'var(--mauve)', color: 'var(--mauve)' }}/>}
            label="Fun Level"
            value={trail.starVotes > 0 ? `${trail.funLevel.toFixed(1)} / 10` : 'Not yet rated'}
          />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

        {/* Tier 2: Planning essentials */}
        <div className="space-y-1.5">
          <Row icon={<Droplets size={13} style={{ color: '#5B8FD0' }}/>} label="Water" value={`${trail.waterLiters}L recommended`} />
          <Row icon={<Sandwich size={13} style={{ color: 'var(--bark)' }}/>} label="Snacks" value={trail.snackSuggestion} />
          <Row icon={<Calendar size={13} style={{ color: 'var(--sage)' }}/>} label="Best Season" value={trail.bestSeason} />
          <Row icon={<PawPrint size={13} style={{ color: 'var(--earth)' }}/>} label="Pets" value="Allowed on leash" />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

        {/* Tier 3: Logistics */}
        <div className="space-y-1.5">
          <Row
            icon={<Users size={13} style={{ color: 'var(--sage)' }}/>}
            label="Crowd Level"
            value={
              trail.starVotes > 0
                ? `${CROWD_ICONS[trail.crowdedness]} ${crowdednessLabel(trail.crowdedness)} (${trail.starVotes.toLocaleString()} reviews)`
                : `${CROWD_ICONS[trail.crowdedness]} Unrated`
            }
          />
          {trail.conditionStatus && (
            <Row
              icon={<Info size={13} style={{ color: 'var(--forest)' }}/>}
              label="Conditions"
              value={trail.conditionStatus + (trail.conditionDetails ? ` – ${trail.conditionDetails}` : '')}
            />
          )}
          {trail.summary && (
            <p className="text-xs leading-relaxed pt-0.5" style={{ color: 'var(--bark)' }}>
              {trail.summary.length > 120 ? trail.summary.slice(0, 120) + '…' : trail.summary}
            </p>
          )}
          {trail.stars > 4.5 && (
            <Row
              icon={<AlertTriangle size={13} style={{ color: 'var(--mauve)' }}/>}
              label="Permit"
              value="Check trail page before going"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--sage)' }}>
        {icon}
        <span className="text-xs" style={{ color: 'var(--bark)' }}>{label}</span>
      </div>
      <span className="text-sm font-medium" style={{ color: 'var(--earth)' }}>
        {value}
      </span>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0" style={{ color: 'var(--sage)' }}>{icon}</span>
      <span className="shrink-0 font-medium" style={{ color: 'var(--earth)', minWidth: '5.5rem' }}>{label}</span>
      <span style={{ color: 'var(--bark)' }}>{value}</span>
    </div>
  )
}
