import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind, Gauge } from "lucide-react"
import { getTemperatureLabel } from "@/lib/temperatureTheme"
import { WindParticles } from "@/components/WindParticles"

interface WindPressureCardProps {
  windSpeed: number
  windDirection: number
  pressure: number
  feelsLike: number
}

function getWindDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}

export function WindPressureCard({
  windSpeed,
  windDirection,
  pressure,
  feelsLike,
}: WindPressureCardProps) {
  const dirLabel = getWindDirectionLabel(windDirection)
  const label = getTemperatureLabel(feelsLike)

  return (
    <Card className="relative overflow-hidden">
      <WindParticles
        windSpeed={windSpeed}
        windDirection={windDirection}
        color="var(--color-primary)"
      />

      <div className="relative z-10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            Wind & Pressure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    style={{
                      stroke: "color-mix(in oklch, var(--color-primary) 20%, transparent)",
                    }}
                    strokeWidth="6"
                  />
                  <text
                    x="50"
                    y="8"
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    className="text-muted-foreground"
                    opacity="0.6"
                  >
                    N
                  </text>
                  <text
                    x="93"
                    y="53"
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    className="text-muted-foreground"
                    opacity="0.6"
                  >
                    E
                  </text>
                  <text
                    x="50"
                    y="97"
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    className="text-muted-foreground"
                    opacity="0.6"
                  >
                    S
                  </text>
                  <text
                    x="7"
                    y="53"
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    className="text-muted-foreground"
                    opacity="0.6"
                  >
                    W
                  </text>
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
                  {dirLabel} ({windDirection}°) · {label}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pressure</span>
              <span className="text-sm font-semibold ml-auto">{Math.round(pressure)} hPa</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
