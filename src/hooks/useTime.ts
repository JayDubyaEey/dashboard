import { useState, useEffect } from "react"

// Timezone never changes during a session — compute once at module load
const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

function getGreeting(hour: number): string {
  if (hour < 5) return "Good Night"
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  if (hour < 21) return "Good Evening"
  return "Good Night"
}

export function useTime() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const greeting = getGreeting(now.getHours())
  const timeString = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateString = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const tzAbbr =
    new Intl.DateTimeFormat("en-GB", { timeZoneName: "short" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? BROWSER_TIMEZONE

  return { now, greeting, timeString, dateString, tzAbbr, timezone: BROWSER_TIMEZONE }
}
