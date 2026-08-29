const KM_TO_MILES = 0.621371

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function formatDistance(km: number): string {
  const mi = km * KM_TO_MILES
  if (mi < 0.5) return `${(mi * 5280).toFixed(0)} ft`
  if (mi < 500) return `${mi.toFixed(1)} mi`
  return `${Math.round(mi).toLocaleString()} mi`
}
