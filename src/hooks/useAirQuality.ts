import { useCallback } from "react"
import { REFRESH_INTERVAL } from "@/lib/constants"
import { useFetchWithPolling } from "@/hooks/useFetchWithPolling"

interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  no2: number
}

export function useAirQuality(lat: number, lon: number) {
  const fetcher = useCallback(async (): Promise<AirQualityData | null> => {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide`
    )
    const data = await res.json()
    const { current } = data
    return {
      aqi: current.european_aqi,
      pm25: current.pm2_5,
      pm10: current.pm10,
      no2: current.nitrogen_dioxide,
    }
  }, [lat, lon])

  const { data: airQuality, loading } = useFetchWithPolling<AirQualityData>(
    fetcher,
    REFRESH_INTERVAL
  )
  return { airQuality, loading }
}
