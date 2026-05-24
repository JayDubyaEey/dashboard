import { MapPin } from "lucide-react"

interface GreetingHeaderProps {
  greeting: string
  city: string
  timeString: string
  dateString: string
  tzAbbr: string
  timezone: string
}

export function GreetingHeader({
  greeting,
  city,
  timeString,
  dateString,
  tzAbbr,
  timezone,
}: GreetingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 min-w-0">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {greeting}, <span className="text-muted-foreground">{city}</span>
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{timezone}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">{tzAbbr}</span>
          <span className="text-3xl font-mono font-semibold tabular-nums">{timeString}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">{dateString}</div>
      </div>
    </div>
  )
}
