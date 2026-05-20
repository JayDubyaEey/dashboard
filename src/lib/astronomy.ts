// Approximate astronomical event dates for a given year
export function getSolsticesAndEquinoxes(year: number) {
  return [
    { name: "Spring Equinox", date: new Date(year, 2, 20) },
    { name: "Summer Solstice", date: new Date(year, 5, 21) },
    { name: "Autumn Equinox", date: new Date(year, 8, 22) },
    { name: "Winter Solstice", date: new Date(year, 11, 21) },
  ]
}

export function getNextAstronomicalEvent(now: Date) {
  const year = now.getFullYear()
  const events = [...getSolsticesAndEquinoxes(year), ...getSolsticesAndEquinoxes(year + 1)]
  return events.filter((e) => e.date > now).slice(0, 4)
}

export function getNextSpecialEvents(
  now: Date,
  events: readonly { name: string; month: number; day: number }[]
) {
  return events.map((event) => {
    let date = new Date(now.getFullYear(), event.month - 1, event.day)
    if (date <= now) {
      date = new Date(now.getFullYear() + 1, event.month - 1, event.day)
    }
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { name: event.name, date, days }
  })
}

/** Returns days until `target` date from `now`, rounded up. */
export function daysUntil(target: Date, now: Date) {
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Returns solar geometry for a given date and latitude:
 *   apexRatio — canvas apex fraction (used by SkyCanvas arc)
 *   latRad    — latitude in radians
 *   decRad    — solar declination in radians
 */
export function solarGeometry(date: Date, latDeg: number) {
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const diff = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start
  const dayOfYear = Math.floor(diff / 86_400_000)

  const decDeg = -23.45 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10))
  const decRad = (decDeg * Math.PI) / 180
  const latRad = (latDeg * Math.PI) / 180

  const maxElevRad = Math.asin(
    Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad)
  )
  const maxElevDeg = (maxElevRad * 180) / Math.PI

  // Map elevation 0°–90° → apexRatio 0.72–0.05
  const minApex = 0.72,
    maxApex = 0.05
  const apexRatio = minApex - (maxElevDeg / 90) * (minApex - maxApex)

  return { apexRatio, latRad, decRad }
}

/**
 * Computes the sun's elevation angle in degrees at `now` using the
 * standard hour-angle formula. Returns negative values when below horizon.
 */
export function computeSunElevation(
  now: Date,
  sunriseDate: Date,
  sunsetDate: Date,
  latRad: number,
  decRad: number
): number {
  const solarNoonMs = (sunriseDate.getTime() + sunsetDate.getTime()) / 2
  const hoursFromNoon = (now.getTime() - solarNoonMs) / 3_600_000
  const hourAngleRad = hoursFromNoon * (Math.PI / 12)

  const sinEl =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad)
  return Math.asin(Math.max(-1, Math.min(1, sinEl))) * (180 / Math.PI)
}

/** Returns a human-readable twilight phase label for a given sun elevation. */
export function twilightLabel(elevDeg: number): string {
  if (elevDeg >= 0) return ""
  if (elevDeg >= -6) return "Civil twilight"
  if (elevDeg >= -12) return "Nautical twilight"
  if (elevDeg >= -18) return "Astronomical twilight"
  return "Night"
}
