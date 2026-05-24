import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplets, Eye } from "lucide-react"
import { getWeatherDescription } from "@/lib/weatherUtils"
import { getTemperatureLabel } from "@/lib/temperatureTheme"
import { WeatherAnimation } from "@/components/WeatherAnimation"

interface WeatherCardProps {
  temperature: number
  feelsLike: number
  humidity: number
  uvIndex: number
  weatherCode: number
}

export function WeatherCard({
  temperature,
  feelsLike,
  humidity,
  uvIndex,
  weatherCode,
}: WeatherCardProps) {
  const description = getWeatherDescription(weatherCode)
  const label = getTemperatureLabel(feelsLike)

  return (
    <Card className="relative overflow-hidden flex flex-col h-full">
      <WeatherAnimation weatherCode={weatherCode} />

      <div className="relative z-10 flex flex-col flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Thermometer className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            Weather
            <span
              className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "color-mix(in oklch, var(--color-primary) 13%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {label}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="flex flex-col flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                {Math.round(temperature)}°C
              </span>
              <span className="text-muted-foreground text-sm">{description}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mt-auto pt-4">
              <div
                className="flex flex-col items-center gap-1 p-2 rounded-lg"
                style={{
                  backgroundColor: "color-mix(in oklch, var(--color-primary) 10%, transparent)",
                }}
              >
                <Thermometer className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                <span className="text-muted-foreground">Feels like</span>
                <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                  {Math.round(feelsLike)}°C
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Humidity</span>
                <span className="font-semibold">{humidity}%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">UV Index</span>
                <span className="font-semibold">{Math.round(uvIndex)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
