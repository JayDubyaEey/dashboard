import { useCallback } from "react"
import { REFRESH_INTERVAL } from "@/lib/constants"
import { useFetchWithPolling } from "@/hooks/useFetchWithPolling"

interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  no2: number
  pollen: {
    alder: number | null
    birch: number | null
    grass: number | null
    mugwort: number | null
    olive: number | null
    ragweed: number | null
  }
}

export function useAirQuality(lat: number, lon: number) {
  const fetcher = useCallback(async (): Promise<AirQualityData | null> => {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`
    )
    const data = await res.json()
    const { current } = data
    return {
      aqi: current.european_aqi,
      pm25: current.pm2_5,
      pm10: current.pm10,
      no2: current.nitrogen_dioxide,
      pollen: {
        alder: current.alder_pollen ?? null,
        birch: current.birch_pollen ?? null,
        grass: current.grass_pollen ?? null,
        mugwort: current.mugwort_pollen ?? null,
        olive: current.olive_pollen ?? null,
        ragweed: current.ragweed_pollen ?? null,
      },
    }
  }, [lat, lon])

  const { data: airQuality, loading } = useFetchWithPolling<AirQualityData>(
    fetcher,
    REFRESH_INTERVAL
  )
  return { airQuality, loading }
}
