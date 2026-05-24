import { useState, useEffect } from "react"

/**
 * Fetches data immediately on mount, then re-fetches on `interval`.
 * `fetcher` should be a stable `useCallback` reference — when it changes
 * (e.g. lat/lon changed) the effect re-runs, triggering a fresh fetch.
 */
export function useFetchWithPolling<T extends object>(
  fetcher: () => Promise<T | null>,
  interval: number
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const result = await fetcher()
        if (!cancelled && result !== null) {
          setData(result)
          setLastUpdated(new Date())
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    const id = setInterval(run, interval)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fetcher, interval])

  return { data, loading, lastUpdated }
}
