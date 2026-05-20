import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind } from "lucide-react"
import { getAqiLabel } from "@/lib/airQuality"
import { AirParticles } from "@/components/AirParticles"

interface AirQualityCardProps {
  aqi: number
  pm25: number
  pm10: number
  no2: number
}

interface PollutantConfig {
  label: string
  unit: string
  value: number
  // [threshold, colour, status label] — first threshold the value is below wins
  bands: [number, string, string][]
}

function getPollutantInfo(cfg: PollutantConfig) {
  const band = cfg.bands.find(([thresh]) => cfg.value < thresh) ?? cfg.bands[cfg.bands.length - 1]
  const color = band[1]
  const status = band[2]
  return { color, status }
}

// EU AQI breakpoints (μg/m³)
const POLLUTANTS = (pm25: number, pm10: number, no2: number): PollutantConfig[] => [
  {
    label: "PM2.5",
    unit: "μg/m³",
    value: pm25,
    bands: [
      [10, "#4ade80", "Good"],
      [20, "#a3e635", "Fair"],
      [25, "#facc15", "Moderate"],
      [50, "#fb923c", "Poor"],
      [75, "#f87171", "Very Poor"],
      [Infinity, "#c084fc", "Hazardous"],
    ],
  },
  {
    label: "PM10",
    unit: "μg/m³",
    value: pm10,
    bands: [
      [20, "#4ade80", "Good"],
      [40, "#a3e635", "Fair"],
      [50, "#facc15", "Moderate"],
      [100, "#fb923c", "Poor"],
      [150, "#f87171", "Very Poor"],
      [Infinity, "#c084fc", "Hazardous"],
    ],
  },
  {
    label: "NO₂",
    unit: "μg/m³",
    value: no2,
    bands: [
      [40, "#4ade80", "Good"],
      [90, "#a3e635", "Fair"],
      [120, "#facc15", "Moderate"],
      [230, "#fb923c", "Poor"],
      [340, "#f87171", "Very Poor"],
      [Infinity, "#c084fc", "Hazardous"],
    ],
  },
]

export function AirQualityCard({ aqi, pm25, pm10, no2 }: AirQualityCardProps) {
  const { label, color } = getAqiLabel(aqi)
  const progress = Math.min(aqi / 100, 1)
  const pollutants = POLLUTANTS(pm25, pm10, no2)

  return (
    <Card className="relative overflow-hidden">
      <AirParticles aqi={aqi} />

      <div className="relative z-10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="w-4 h-4" />
            Air Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Radial gauge */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="currentColor"
                    className="text-secondary"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={`${progress * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{aqi}</span>
                  <span className="text-xs text-muted-foreground">AQI</span>
                </div>
              </div>
              <div>
                <span className="text-lg font-semibold" style={{ color }}>
                  {label}
                </span>
                <p className="text-xs text-muted-foreground mt-1">European AQI</p>
              </div>
            </div>

            {/* Pollutant details */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {pollutants.map((cfg) => {
                const { color: pColor, status } = getPollutantInfo(cfg)
                return (
                  <div key={cfg.label} className="p-2 rounded-lg bg-secondary space-y-1.5">
                    {/* Name + status dot */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground font-medium">{cfg.label}</span>
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: pColor }}
                      />
                    </div>
                    {/* Value + unit */}
                    <div className="font-semibold tabular-nums">{cfg.value.toFixed(1)}</div>
                    {/* Status label */}
                    <div className="text-[10px] font-medium" style={{ color: pColor }}>
                      {status}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
