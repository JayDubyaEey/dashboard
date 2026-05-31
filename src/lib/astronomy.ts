// Approximate astronomical event dates for a given year
function getSolsticesAndEquinoxes(year: number) {
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

// ── Moon ──────────────────────────────────────────────────────────────────────

// Known new moon reference: 6 Jan 2000 18:14 UTC
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0)
const SYNODIC_PERIOD_MS = 29.53059 * 24 * 3_600_000

export interface MoonPhaseData {
  /** 0–1 through synodic cycle: 0/1=new, 0.25=first quarter, 0.5=full, 0.75=last quarter */
  phase: number
  /** 0–1 fraction of disc illuminated */
  illumination: number
  /** Human-readable phase name */
  name: string
}

/**
 * Returns the current lunar phase based on a known reference new moon and the
 * synodic period (29.53059 days).
 */
export function moonPhase(now: Date): MoonPhaseData {
  const raw = ((now.getTime() - REFERENCE_NEW_MOON_MS) / SYNODIC_PERIOD_MS) % 1
  const phase = raw < 0 ? raw + 1 : raw

  // Fraction of disc illuminated (0 at new moon, 1 at full moon)
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2

  let name: string
  if (phase < 0.0625 || phase >= 0.9375) name = "New Moon"
  else if (phase < 0.1875) name = "Waxing Crescent"
  else if (phase < 0.3125) name = "First Quarter"
  else if (phase < 0.4375) name = "Waxing Gibbous"
  else if (phase < 0.5625) name = "Full Moon"
  else if (phase < 0.6875) name = "Waning Gibbous"
  else if (phase < 0.8125) name = "Last Quarter"
  else name = "Waning Crescent"

  return { phase, illumination, name }
}

/**
 * Returns the moon's 0–1 arc progress across the night sky, or `null` if the
 * moon is below the horizon for the current night.
 *
 * Approximation: the moon rises and sets approximately `phase × 24 h` later
 * than the sun each day (new moon ≈ with the sun; full moon ≈ at sunset/sunrise).
 */
export function moonNightProgress(
  now: Date,
  sunriseDate: Date,
  sunsetDate: Date,
  phase: number
): number | null {
  // Approximate moon visibility period based on phase offset from the sun.
  // Full moon (phase=0.5) rises at sunset, sets at sunrise.
  // We calculate relative to the nearest solar noon and check multiple
  // day offsets to handle the midnight boundary correctly.
  const dayMs = sunsetDate.getTime() - sunriseDate.getTime()
  const solarNoonMs = (sunriseDate.getTime() + sunsetDate.getTime()) / 2
  const halfDayMs = dayMs / 2

  const moonLagMs = phase * 24 * 3_600_000
  const nowMs = now.getTime()

  // Check today and yesterday's solar noon to find the active moon transit
  for (const offset of [0, -86_400_000, 86_400_000]) {
    const baseNoon = solarNoonMs + offset
    const moonRiseMs = baseNoon - halfDayMs + moonLagMs
    const moonSetMs = baseNoon + halfDayMs + moonLagMs

    if (nowMs >= moonRiseMs && nowMs <= moonSetMs) {
      return (nowMs - moonRiseMs) / (moonSetMs - moonRiseMs)
    }
  }

  return null
}
