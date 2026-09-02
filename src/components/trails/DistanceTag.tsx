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
        color: '#FFFFFF',
        letterSpacing: '0.02em',
        fontWeight: 500,
        textShadow: '0 1px 3px rgba(20,15,10,0.55), 0 0 10px rgba(20,15,10,0.35)',
      }}
    >
      {formatDistance(km)} away
    </span>
  )
}
