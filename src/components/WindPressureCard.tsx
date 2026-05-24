import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind, Gauge, Zap } from "lucide-react"
import { WindParticles } from "@/components/WindParticles"

interface WindPressureCardProps {
  windSpeed: number
  windDirection: number
  windGusts: number
  pressure: number
}

function getWindDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}

function getBeaufortLabel(kmh: number): string {
  if (kmh < 1) return "Calm"
  if (kmh < 6) return "Light air"
  if (kmh < 12) return "Light breeze"
  if (kmh < 20) return "Gentle breeze"
  if (kmh < 29) return "Moderate breeze"
  if (kmh < 39) return "Fresh breeze"
  if (kmh < 50) return "Strong breeze"
  if (kmh < 62) return "Near gale"
  if (kmh < 75) return "Gale"
  if (kmh < 89) return "Strong gale"
  if (kmh < 103) return "Storm"
  if (kmh < 118) return "Violent storm"
  return "Hurricane"
}

function getPressureLabel(hpa: number): string {
  if (hpa < 980) return "Very low"
  if (hpa < 1000) return "Low"
  if (hpa < 1013) return "Below avg"
  if (hpa < 1020) return "Normal"
  if (hpa < 1035) return "High"
  return "Very high"
}

export function WindPressureCard({
  windSpeed,
  windDirection,
  windGusts,
  pressure,
}: WindPressureCardProps) {
  const dirLabel = getWindDirectionLabel(windDirection)
  const beaufort = getBeaufortLabel(windSpeed)
  const pressureLabel = getPressureLabel(pressure)

  return (
    <Card className="relative overflow-hidden flex flex-col h-full">
      <WindParticles
        windSpeed={windSpeed}
        windDirection={windDirection}
        color="var(--color-primary)"
      />

      <div className="relative z-10 flex flex-col flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            Wind & Pressure
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="flex flex-col flex-1">
            {/* Compass + speed */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    style={{ stroke: "color-mix(in oklch, var(--color-primary) 20%, transparent)" }}
                    strokeWidth="6"
                  />
                  {["N", "E", "S", "W"].map((d, i) => {
                    const positions = [
                      { x: 50, y: 8 },
                      { x: 93, y: 53 },
                      { x: 50, y: 97 },
                      { x: 7, y: 53 },
                    ]
                    return (
                      <text
                        key={d}
                        x={positions[i].x}
                        y={positions[i].y}
                        textAnchor="middle"
                        fontSize="8"
                        fill="currentColor"
                        className="text-muted-foreground"
                        opacity="0.6"
                      >
                        {d}
                      </text>
                    )
                  })}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 30 * Math.sin((windDirection * Math.PI) / 180)}
                    y2={50 - 30 * Math.cos((windDirection * Math.PI) / 180)}
                    style={{ stroke: "var(--color-primary)" }}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="50" r="4" style={{ fill: "var(--color-primary)" }} />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(windSpeed)} km/h</div>
                <div className="text-sm text-muted-foreground">
                  {dirLabel} · {beaufort}
                </div>
              </div>
            </div>

            {/* Detail rows pushed to bottom */}
            <div className="mt-auto pt-4 space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
                <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Gusts</span>
                <span className="font-semibold ml-auto">{Math.round(windGusts)} km/h</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
                <Gauge className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Pressure</span>
                <span className="text-xs text-muted-foreground ml-1">({pressureLabel})</span>
                <span className="font-semibold ml-auto">{Math.round(pressure)} hPa</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
