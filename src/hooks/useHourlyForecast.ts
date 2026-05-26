import { useCallback } from "react"
import { REFRESH_INTERVAL } from "@/lib/constants"
import { useFetchWithPolling } from "@/hooks/useFetchWithPolling"

export interface HourlyData {
  times: string[]
  temperatures: number[]
}

export function useHourlyForecast(lat: number, lon: number) {
  const fetcher = useCallback(async (): Promise<HourlyData | null> => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&forecast_hours=24`
    )
    const data = await res.json()
    return {
      times: data.hourly.time,
      temperatures: data.hourly.temperature_2m,
    }
  }, [lat, lon])

  const { data, loading } = useFetchWithPolling<HourlyData>(fetcher, REFRESH_INTERVAL)
  return { hourly: data, loading }
}
