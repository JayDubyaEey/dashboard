import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { HourlyData } from "@/hooks/useHourlyForecast"

interface HourlyChartProps {
  data: HourlyData
}

function getTempColor(temp: number): string {
  if (temp >= 30) return "#ef4444" // red
  if (temp >= 10) return "#22c55e" // green
  return "#3b82f6" // blue
}

export function HourlyChart({ data }: HourlyChartProps) {
  const { times, temperatures } = data
  const min = Math.min(...temperatures)
  const max = Math.max(...temperatures)
  const range = max - min || 1

  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const chartHeight = 80
  const chartWidth = 100
  const padding = { top: 10, bottom: 20 }
  const graphH = chartHeight - padding.top - padding.bottom
  const graphW = chartWidth

  // Build points
  const points = temperatures.map((temp, i) => {
    const x = (i / (temperatures.length - 1)) * graphW
    const y = padding.top + graphH - ((temp - min) / range) * graphH
    return { x, y, temp }
  })

  // Catmull-Rom → cubic bezier conversion
  // Returns the two cubic bezier control points between points[i] and points[i+1]
  function catmullRomCP(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    tension = 0.5
  ) {
    return {
      cp1x: p1.x + ((p2.x - p0.x) / 6) * tension,
      cp1y: p1.y + ((p2.y - p0.y) / 6) * tension,
      cp2x: p2.x - ((p3.x - p1.x) / 6) * tension,
      cp2y: p2.y - ((p3.y - p1.y) / 6) * tension,
    }
  }

  function buildCatmullRomPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return ""
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const { cp1x, cp1y, cp2x, cp2y } = catmullRomCP(p0, p1, p2, p3)
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  // Build segments with color using Catmull-Rom
  const segments: string[] = []
  const segmentColors: string[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const { cp1x, cp1y, cp2x, cp2y } = catmullRomCP(p0, p1, p2, p3)
    segments.push(`M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`)
    segmentColors.push(getTempColor((p1.temp + p2.temp) / 2))
  }

  // Full path for fill
  const fullPathD = buildCatmullRomPath(points)
  const fillD = `${fullPathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  // Label every 3 hours
  const hourLabels = times
    .map((t, i) => ({ i, label: new Date(t).getHours() }))
    .filter((_, i) => i % 3 === 0)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const idx = Math.round(relX * (temperatures.length - 1))
    const clamped = Math.max(0, Math.min(temperatures.length - 1, idx))
    setHover({ i: clamped, x: points[clamped].x, y: points[clamped].y })
  }

  function handleMouseLeave() {
    setHover(null)
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          Next 24 Hours
          <span
            className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "color-mix(in oklch, var(--color-primary) 13%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            {Math.round(min)}° – {Math.round(max)}°
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-20 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="hourly-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillD} fill="url(#hourly-fill)" />
            {/* Colored line segments */}
            {segments.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={segmentColors[i]}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* Hover indicator */}
            {hover && (
              <>
                <line
                  x1={hover.x}
                  y1={padding.top}
                  x2={hover.x}
                  y2={chartHeight - padding.bottom}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth="0.3"
                  strokeDasharray="1 1"
                  opacity="0.5"
                />
                <circle
                  cx={hover.x}
                  cy={hover.y}
                  r="1.5"
                  fill={getTempColor(temperatures[hover.i])}
                  stroke="white"
                  strokeWidth="0.4"
                />
              </>
            )}
          </svg>
          {/* Tooltip */}
          {hover && (
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-2 py-1 rounded text-xs font-medium shadow-md"
              style={{
                left: `${(hover.x / chartWidth) * 100}%`,
                top: `${(hover.y / chartHeight) * 100}%`,
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                color: getTempColor(temperatures[hover.i]),
              }}
            >
              {Math.round(temperatures[hover.i])}°C
              <span className="text-muted-foreground ml-1">
                {new Date(times[hover.i]).getHours().toString().padStart(2, "0")}:00
              </span>
            </div>
          )}
        </div>
        {/* Hour labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-0.5">
          {hourLabels.map(({ i, label }) => (
            <span key={i}>{label.toString().padStart(2, "0")}:00</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
