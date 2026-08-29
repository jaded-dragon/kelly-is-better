import { formatDistance } from '../../utils/distance'

interface DistanceTagProps {
  km: number | undefined
}

export function DistanceTag({ km }: DistanceTagProps) {
  if (km === undefined) return null
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full shrink-0"
      style={{
        background: 'rgba(86,168,110,0.18)',
        color: 'var(--sage)',
        letterSpacing: '0.02em',
        fontWeight: 500,
      }}
    >
      {formatDistance(km)} away
    </span>
  )
}
