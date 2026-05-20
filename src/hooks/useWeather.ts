import { useCallback } from "react"
import { REFRESH_INTERVAL } from "@/lib/constants"
import { useFetchWithPolling } from "@/hooks/useFetchWithPolling"

interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  uvIndex: number
  weatherCode: number
  sunrise: string
  sunset: string
}

export function useWeather(lat: number, lon: number) {
  const fetcher = useCallback(async (): Promise<WeatherData | null> => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index&daily=sunrise,sunset&timezone=auto&forecast_days=1`
    )
    const data = await res.json()
    const { current, daily } = data
    return {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      pressure: current.surface_pressure,
      uvIndex: current.uv_index,
      weatherCode: current.weather_code,
      sunrise: daily.sunrise[0],
      sunset: daily.sunset[0],
    }
  }, [lat, lon])

  const {
    data: weather,
    loading,
    lastUpdated,
  } = useFetchWithPolling<WeatherData>(fetcher, REFRESH_INTERVAL)
  return { weather, loading, lastUpdated }
}
