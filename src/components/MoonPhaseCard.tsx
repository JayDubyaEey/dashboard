import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon } from "lucide-react"
import { moonPhase, type MoonPhaseData } from "@/lib/astronomy"

interface MoonPhaseCardProps {
  now: Date
}

function MoonDisc({ phase }: { phase: number; illumination: number }) {
  // Draw a moon disc using SVG with the shadow overlay
  const size = 64
  const r = size / 2 - 2

  // Determine which side is illuminated
  // phase 0–0.5: right side lit (waxing), 0.5–1: left side lit (waning)
  const isWaxing = phase < 0.5

  // The terminator curve: how much of the visible disc is in shadow
  // At new moon (0): fully shadowed. At full (0.5): fully lit.
  // Use cosine to get the x-offset of the terminator ellipse
  const terminatorX = Math.cos(phase * 2 * Math.PI) * r

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {/* Base disc (lit side) */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="var(--color-primary)" opacity={0.9} />
      {/* Shadow overlay using arc */}
      <path
        d={`
          M ${size / 2} ${size / 2 - r}
          A ${r} ${r} 0 0 ${isWaxing ? 0 : 1} ${size / 2} ${size / 2 + r}
          A ${Math.abs(terminatorX)} ${r} 0 0 ${(isWaxing ? terminatorX > 0 : terminatorX < 0) ? 0 : 1} ${size / 2} ${size / 2 - r}
          Z
        `}
        fill="var(--color-card)"
        opacity={0.85}
      />
      {/* Subtle rim */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="0.5"
        opacity={0.3}
      />
    </svg>
  )
}

export function MoonPhaseCard({ now }: MoonPhaseCardProps) {
  const moon: MoonPhaseData = moonPhase(now)

  // Calculate next full and new moon
  const synodicPeriod = 29.53059
  const daysToFull = ((0.5 - moon.phase + 1) % 1) * synodicPeriod
  const daysToNew = ((1 - moon.phase) % 1) * synodicPeriod

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Moon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          Moon Phase
          <span
            className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "color-mix(in oklch, var(--color-primary) 13%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            {Math.round(moon.illumination * 100)}% lit
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <MoonDisc phase={moon.phase} illumination={moon.illumination} />
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
            {moon.name}
          </span>
          <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
            <span>Full moon in {Math.round(daysToFull)} days</span>
            <span>New moon in {Math.round(daysToNew)} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
