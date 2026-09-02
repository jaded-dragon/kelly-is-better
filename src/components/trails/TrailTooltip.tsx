import { Clock, TrendingUp, Star, Calendar, AlertTriangle, Users, Activity, Info } from 'lucide-react'
import type { Trail } from '../../types/trail'
import { formatTime } from '../../utils/timeEstimate'
import { crowdednessLabel } from '../../utils/recommendations'

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: '#78E498', bg: 'rgba(14,40,24,0.55)' },
  moderate: { label: 'Moderate', color: '#D4A85A', bg: 'rgba(30,22,8,0.55)' },
  hard: { label: 'Hard', color: '#E89080', bg: 'rgba(34,16,12,0.55)' },
  expert: { label: 'Expert', color: '#E86068', bg: 'rgba(30,8,10,0.55)' },
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
  alignRight?: boolean
}

export function TrailTooltip({ trail, below = false, alignRight = false }: TrailTooltipProps) {
  const diff = DIFFICULTY_CONFIG[trail.difficulty]

  return (
    <div
      className="tooltip-enter absolute z-50 rounded-2xl shadow-2xl overflow-hidden pointer-events-none"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--moss)',
        width: '32rem',
        maxWidth: '92vw',
        ...(below
          ? { top: 'calc(100% + 10px)', bottom: 'auto' }
          : { bottom: 'calc(100% + 10px)', top: 'auto' }),
        ...(alignRight
          ? { right: 0, left: 'auto', transform: 'none' }
          : { left: '50%', transform: 'translateX(-50%)' }),
        boxShadow: '0 8px 40px rgba(42,31,26,0.18)',
      }}
      role="tooltip"
    >
      {/* Difficulty header bar */}
      <div
        className="px-8 py-5 flex items-center justify-center gap-4 text-center"
        style={{ background: diff.bg }}
      >
        <span className="text-sm font-semibold tracking-wider uppercase whitespace-nowrap" style={{ color: diff.color }}>
          {diff.label}
        </span>
        <span className="text-xs whitespace-nowrap" style={{ color: diff.color }}>
          {TRAIL_TYPE_ICONS[trail.trailType]}
        </span>
      </div>

      <div className="px-8 py-8 space-y-6 text-center">
        {/* Tier 1: Decision critical */}
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<Clock size={13}/>} label="Time" value={formatTime(trail.estimatedTimeHours)} />
          <Stat icon={<Activity size={13}/>} label="Distance" value={`${trail.lengthMiles.toFixed(1)} mi`} />
          <Stat icon={<TrendingUp size={13}/>} label="Elevation Gain" value={`${trail.ascentFeet.toLocaleString()} ft`} />
          <Stat
            icon={<Star size={13} style={{ fill: 'var(--mauve)', color: 'var(--mauve)' }}/>}
            label="Fun Level"
            value={trail.starVotes > 0 ? `${trail.funLevel.toFixed(1)} / 10` : 'Not yet rated'}
          />
        </div>

        <div style={{ borderTop: '1px solid rgba(74,110,74,0.18)' }} />

        {/* Tier 2: Planning essentials */}
        <Row icon={<Calendar size={13} style={{ color: 'var(--forest)' }}/>} label="Best Season" value={trail.bestSeason} />

        <div style={{ borderTop: '1px solid rgba(74,110,74,0.18)' }} />

        {/* Tier 3: Logistics */}
        <div className="space-y-3">
          <Row
            icon={<Users size={13} style={{ color: 'var(--forest)' }}/>}
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
            <p className="text-xs leading-relaxed" style={{ color: 'var(--sand)' }}>
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
      className="rounded-xl px-4 py-3.5 text-center"
      style={{ background: 'rgba(122,180,138,0.16)' }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1.5" style={{ color: 'var(--forest)' }}>
        {icon}
        <span className="text-xs" style={{ color: 'var(--sand)' }}>{label}</span>
      </div>
      <span className="text-base font-medium" style={{ color: 'var(--cream)' }}>
        {value}
      </span>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-center">
      <span className="shrink-0">{icon}</span>
      <span className="shrink-0 font-medium" style={{ color: 'var(--cream)' }}>{label}</span>
      {value && <span className="leading-relaxed" style={{ color: 'var(--sand)' }}>{value}</span>}
    </div>
  )
}
