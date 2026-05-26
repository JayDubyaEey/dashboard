import { useState, useEffect } from "react"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useTime } from "@/hooks/useTime"
import { useWeather } from "@/hooks/useWeather"
import { useAirQuality } from "@/hooks/useAirQuality"
import { useHourlyForecast } from "@/hooks/useHourlyForecast"
import { useTheme } from "@/hooks/useTheme"
import { GreetingHeader } from "@/components/GreetingHeader"
import { WeatherCard } from "@/components/WeatherCard"
import { WindPressureCard } from "@/components/WindPressureCard"
import { SunArcCard } from "@/components/SunArcCard"
import { AirQualityCard } from "@/components/AirQualityCard"
import { CountdownRings } from "@/components/CountdownRings"
import { AllergyCard } from "@/components/AllergyCard"
import { HourlyChart } from "@/components/HourlyChart"
import { MoonPhaseCard } from "@/components/MoonPhaseCard"
import { ThemePanel, ThemeTrigger } from "@/components/ThemePanel"
import { Loader2, RefreshCw, GitFork, CloudSun, Maximize, Minimize } from "lucide-react"

function App() {
  const { location, loading: geoLoading } = useGeolocation()
  const { now, greeting, timeString, dateString, tzAbbr, timezone } = useTime()
  const { weather, loading: weatherLoading, lastUpdated } = useWeather(location.lat, location.lon)
  const { airQuality, loading: aqLoading } = useAirQuality(location.lat, location.lon)
  const { hourly } = useHourlyForecast(location.lat, location.lon)
  const { mode, setThemeMode, background, backgroundId, setBackground } = useTheme()

  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request denied:", err.message)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen failed:", err.message)
      })
    }
  }

  // Sync state if user exits fullscreen via Escape
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const isLoading = geoLoading || weatherLoading || aqLoading

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={background.value ? { background: background.value } : undefined}
    >
      <div className="flex-1 flex flex-col justify-center w-[80%] mx-auto p-4 sm:p-8">
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
            {/* Row 1: Weather · Wind & Pressure · Air Quality · Pollen — 4 equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  windGusts={weather.windGusts}
                  pressure={weather.pressure}
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
              {airQuality && <AllergyCard pollen={airQuality.pollen} />}
            </div>

            {/* Row 2: Hourly temperature chart — full width */}
            {hourly && <HourlyChart data={hourly} />}

            {/* Row 3: Sun Arc + Moon Phase */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {weather && (
                <div className="lg:col-span-3">
                  <SunArcCard
                    sunrise={weather.sunrise}
                    sunset={weather.sunset}
                    now={now}
                    lat={location.lat}
                  />
                </div>
              )}
              <div className="lg:col-span-1">
                <MoonPhaseCard now={now} />
              </div>
            </div>

            {/* Row 3: Countdowns — full width */}
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
        <footer className="fixed bottom-0 left-0 right-0 pb-4 pt-3 px-[10%]">
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

            {/* Centre — appearance + fullscreen */}
            <div className="flex items-center gap-3">
              <ThemeTrigger open={appearanceOpen} onToggle={() => setAppearanceOpen((o) => !o)} />
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-3.5 h-3.5" />
                ) : (
                  <Maximize className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
              </button>
            </div>

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
