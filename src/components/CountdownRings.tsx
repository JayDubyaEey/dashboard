import { Card, CardContent } from "@/components/ui/card"
import { getNextAstronomicalEvent, getNextSpecialEvents, daysUntil } from "@/lib/astronomy"
import { SPECIAL_EVENTS } from "@/lib/constants"

interface CountdownRingsProps {
  now: Date
}

const RING_RADIUS = 28

const ASTRONOMICAL_COLORS: Record<string, { stroke: string; label: string }> = {
  "Spring Equinox": { stroke: "#6ee7b7", label: "🌸" },
  "Summer Solstice": { stroke: "#fcd34d", label: "☀️" },
  "Autumn Equinox": { stroke: "#fb923c", label: "🍂" },
  "Winter Solstice": { stroke: "#93c5fd", label: "❄️" },
}

const SPECIAL_COLORS: Record<string, { stroke: string; label: string }> = {
  Christmas: { stroke: "#4ade80", label: "🎄" },
  "New Year": { stroke: "#c084fc", label: "🎆" },
}

export function CountdownRings({ now }: CountdownRingsProps) {
  const astronomicalEvents = getNextAstronomicalEvent(now)
  const specialEvents = getNextSpecialEvents(now, SPECIAL_EVENTS)

  const astro = astronomicalEvents
    .map((e) => ({
      name: e.name,
      days: daysUntil(e.date, now),
      type: "astronomical" as const,
    }))
    .sort((a, b) => a.days - b.days)

  const special = specialEvents
    .map((e) => ({ name: e.name, days: e.days, type: "special" as const }))
    .sort((a, b) => a.days - b.days)

  const allEvents = [...astro, ...special]

  const maxDays = 365

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-items-center">
          {allEvents.map((event) => {
            const progress = 1 - event.days / maxDays
            const circumference = 2 * Math.PI * RING_RADIUS
            const offset = circumference * (1 - Math.max(0, Math.min(1, progress)))
            const colorMap = event.type === "astronomical" ? ASTRONOMICAL_COLORS : SPECIAL_COLORS
            const meta = colorMap[event.name] ?? { stroke: "#94a3b8", label: "📅" }

            return (
              <div key={event.name} className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={RING_RADIUS}
                      fill="none"
                      stroke={meta.stroke + "33"}
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={RING_RADIUS}
                      fill="none"
                      stroke={meta.stroke}
                      strokeWidth="4"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold leading-none">{event.days}</span>
                    <span className="text-[9px] text-muted-foreground leading-none">days</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm">{meta.label}</div>
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    {event.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
