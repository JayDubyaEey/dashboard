import { Card } from "@/components/ui/card"
import { SkyCanvas } from "@/components/SkyCanvas"
import { useIsDark } from "@/hooks/useIsDark"
import { solarGeometry, computeSunElevation, twilightLabel } from "@/lib/astronomy"

interface SunArcCardProps {
  sunrise: string
  sunset: string
  now: Date
  lat?: number // degrees, defaults to London
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function SunArcCard({ sunrise, sunset, now, lat = 51.5074 }: SunArcCardProps) {
  const isDark = useIsDark()

  const sunriseDate = new Date(sunrise)
  const sunsetDate = new Date(sunset)
  const dayMs = sunsetDate.getTime() - sunriseDate.getTime()
  const elapsedMs = now.getTime() - sunriseDate.getTime()
  const progress = Math.max(0, Math.min(1, elapsedMs / dayMs))
  const isDaytime = now >= sunriseDate && now <= sunsetDate

  const { apexRatio, latRad, decRad } = solarGeometry(now, lat)
  const sunElevationDeg = computeSunElevation(now, sunriseDate, sunsetDate, latRad, decRad)

  // nightProgress: 0 = just after sunset, 0.5 = midnight, 1 = just before sunrise
  const nightMs = 86_400_000 - dayMs
  let nightProgress = 0
  if (!isDaytime) {
    if (now.getTime() > sunsetDate.getTime()) {
      nightProgress = Math.min(0.5, (now.getTime() - sunsetDate.getTime()) / nightMs)
    } else {
      nightProgress = Math.max(0.5, 1 - (sunriseDate.getTime() - now.getTime()) / nightMs)
    }
  }

  // Sun position — clamped to visible arc when daytime, parked when night
  const sunProgress = isDaytime ? progress : 0

  // Countdown + subtext
  const toSunset = sunsetDate.getTime() - now.getTime()
  const toSunrise = sunriseDate.getTime() - now.getTime()
  const phase = twilightLabel(sunElevationDeg)

  let countdown: string
  let subtext: string

  if (isDaytime) {
    const h = Math.floor(toSunset / 3_600_000)
    const m = Math.floor((toSunset % 3_600_000) / 60_000)
    countdown = `Sunset in ${h}h ${m}m`
    subtext = `${Math.round(progress * 100)}% of daylight elapsed`
  } else if (toSunrise > 0) {
    const h = Math.floor(toSunrise / 3_600_000)
    const m = Math.floor((toSunrise % 3_600_000) / 60_000)
    countdown = `Sunrise in ${h}h ${m}m`
    subtext = phase
  } else {
    countdown = "Sun has set"
    subtext = phase
  }

  const dayMins = Math.round(dayMs / 60_000)
  const dayHrs = Math.floor(dayMins / 60)
  const dayRemMins = dayMins % 60
  const dayLength = `${dayHrs}h ${dayRemMins}m daylight`

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Sky scene */}
      <div className="h-44 shrink-0">
        <SkyCanvas
          progress={progress}
          isDaytime={isDaytime}
          sunProgress={sunProgress}
          isDark={isDark}
          apexRatio={apexRatio}
          sunElevationDeg={sunElevationDeg}
          nightProgress={nightProgress}
        />
      </div>

      {/* Info panel */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{countdown}</span>
          <span className="text-xs text-muted-foreground">{subtext}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>☀ {fmt(sunriseDate)}</span>
            <span>{fmt(sunsetDate)} ☀</span>
          </div>
          {/* Progress bar with noon marker */}
          <div className="relative h-1.5">
            <div className="h-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${isDaytime ? progress * 100 : 0}%`,
                  background: "var(--color-primary)",
                }}
              />
            </div>
            {/* Noon marker — a small tick at the 50% point */}
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-muted-foreground/40"
              style={{ left: "50%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">{dayLength}</p>
        </div>
      </div>
    </Card>
  )
}
