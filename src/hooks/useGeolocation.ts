import { useState, useEffect } from "react"
import { UK_DEFAULT } from "@/lib/constants"

interface Location {
  lat: number
  lon: number
  city: string
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location>(UK_DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Reverse geocode for city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const city =
            data.address?.city || data.address?.town || data.address?.village || "Your Location"
          setLocation({ lat: latitude, lon: longitude, city })
        } catch {
          setLocation({ lat: latitude, lon: longitude, city: "Your Location" })
        }
        setLoading(false)
      },
      () => {
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }, [])

  return { location, loading }
}
