import { Card } from "@/components/ui/card"
import { SkyCanvas } from "@/components/SkyCanvas"
import { useIsDark } from "@/hooks/useIsDark"
import {
  solarGeometry,
  computeSunElevation,
  twilightLabel,
  moonPhase,
  moonNightProgress,
} from "@/lib/astronomy"
import { formatMsToHM } from "@/lib/utils"

interface SunArcCardProps {
  sunrise: string
  sunset: string
  now: Date
  lat?: number // degrees, defaults to London
}

function formatHHMM(d: Date) {
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

  const solarNoonMs = (sunriseDate.getTime() + sunsetDate.getTime()) / 2
  const solarNoon = new Date(solarNoonMs)
  const { apexRatio, latRad, decRad } = solarGeometry(now, lat)
  const sunElevationDeg = computeSunElevation(now, sunriseDate, sunsetDate, latRad, decRad)

  // Sun position — clamped to visible arc when daytime, parked at start when night
  const sunProgress = isDaytime ? progress : 0

  // Moon — can be visible day or night depending on phase
  const moonPhaseData = moonPhase(now)
  const moonProgress = moonNightProgress(now, sunriseDate, sunsetDate, moonPhaseData.phase)

  // Countdown + subtext
  const toSunset = sunsetDate.getTime() - now.getTime()
  const toSunrise = sunriseDate.getTime() - now.getTime()
  const phase = twilightLabel(sunElevationDeg)

  let countdown: string
  let subtext: string

  if (isDaytime) {
    countdown = `Sunset in ${formatMsToHM(toSunset)}`
    subtext = `${Math.round(progress * 100)}% of daylight elapsed`
  } else if (toSunrise > 0) {
    countdown = `Sunrise in ${formatMsToHM(toSunrise)}`
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
          moonProgress={moonProgress}
          moonPhaseData={moonPhaseData}
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
            <span>☀ {formatHHMM(sunriseDate)}</span>
            <span>{formatHHMM(sunsetDate)} ☀</span>
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
            {/* Noon marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-muted-foreground/40" />
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
              {formatHHMM(solarNoon)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">{dayLength}</p>
        </div>
      </div>
    </Card>
  )
}
