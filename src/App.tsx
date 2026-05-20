import { useState } from "react"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useTime } from "@/hooks/useTime"
import { useWeather } from "@/hooks/useWeather"
import { useAirQuality } from "@/hooks/useAirQuality"
import { useTheme } from "@/hooks/useTheme"
import { GreetingHeader } from "@/components/GreetingHeader"
import { WeatherCard } from "@/components/WeatherCard"
import { WindPressureCard } from "@/components/WindPressureCard"
import { SunArcCard } from "@/components/SunArcCard"
import { AirQualityCard } from "@/components/AirQualityCard"
import { CountdownRings } from "@/components/CountdownRings"
import { ThemePanel, ThemeTrigger } from "@/components/ThemePanel"
import { Loader2, RefreshCw, GitFork, CloudSun } from "lucide-react"

function App() {
  const { location, loading: geoLoading } = useGeolocation()
  const { now, greeting, timeString, dateString, tzAbbr, timezone } = useTime()
  const { weather, loading: weatherLoading, lastUpdated } = useWeather(location.lat, location.lon)
  const { airQuality, loading: aqLoading } = useAirQuality(location.lat, location.lon)
  const { mode, setThemeMode, background, backgroundId, setBackground } = useTheme()

  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const isLoading = geoLoading || weatherLoading || aqLoading

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={background.value ? { background: background.value } : undefined}
    >
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        {/* Header row */}
        <div className="mb-8">
          <GreetingHeader
            greeting={greeting}
            city={location.city}
            timeString={timeString}
            dateString={dateString}
            tzAbbr={tzAbbr}
            timezone={timezone}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {weather && (
                <WeatherCard
                  temperature={weather.temperature}
                  feelsLike={weather.feelsLike}
                  humidity={weather.humidity}
                  uvIndex={weather.uvIndex}
                  weatherCode={weather.weatherCode}
                />
              )}
              {weather && (
                <WindPressureCard
                  windSpeed={weather.windSpeed}
                  windDirection={weather.windDirection}
                  pressure={weather.pressure}
                  feelsLike={weather.feelsLike}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {weather && (
                <SunArcCard
                  sunrise={weather.sunrise}
                  sunset={weather.sunset}
                  now={now}
                  lat={location.lat}
                />
              )}
              {airQuality && (
                <AirQualityCard
                  aqi={airQuality.aqi}
                  pm25={airQuality.pm25}
                  pm10={airQuality.pm10}
                  no2={airQuality.no2}
                />
              )}
            </div>

            <CountdownRings now={now} />

            {appearanceOpen && (
              <ThemePanel
                mode={mode}
                backgroundId={backgroundId}
                forcedMode={background.forcedMode}
                onModeChange={setThemeMode}
                onBackgroundChange={setBackground}
                onClose={() => setAppearanceOpen(false)}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            {/* Left — data source + last updated */}
            <div className="flex items-center gap-4">
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <CloudSun className="w-3.5 h-3.5" />
                <span>Open-Meteo</span>
              </a>
              {lastUpdatedStr && (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" />
                  Updated {lastUpdatedStr}
                </span>
              )}
            </div>

            {/* Centre — appearance */}
            <ThemeTrigger open={appearanceOpen} onToggle={() => setAppearanceOpen((o) => !o)} />

            {/* Right — GitHub */}
            <a
              href="https://github.com/JayDubyaEey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>JayDubyaEey</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
