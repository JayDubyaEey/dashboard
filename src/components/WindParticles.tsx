import { useEffect, useRef } from "react"
import { useCanvasAnimation, type DrawFn, type ResizeFn } from "@/hooks/useCanvasAnimation"
import { useIsDark } from "@/hooks/useIsDark"

interface WindParticlesProps {
  windSpeed: number // km/h
  windDirection: number // degrees: 0=N, 90=E, 180=S, 270=W
  color: string // any CSS color value, including var(--…)
}

interface Particle {
  x: number
  y: number
  length: number
  opacity: number
  speed: number
}

interface WindState {
  particles: Particle[]
  dx: number
  dy: number
  rgb: [number, number, number]
}

/**
 * Resolves any CSS color value (including custom-property references) to an
 * [r, g, b] triple by briefly inserting a hidden element into the DOM and
 * reading its computed `color` style.
 */
function resolveColorToRgb(cssColor: string): [number, number, number] {
  const el = document.createElement("span")
  el.style.color = cssColor
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color // "rgb(r, g, b)"
  document.body.removeChild(el)
  const parts = computed.match(/\d+/g)
  if (!parts || parts.length < 3) return [128, 128, 128]
  return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])]
}

/**
 * Animated streak particles whose speed and density scale with wind speed.
 * Rendered on a canvas that sits behind card content.
 */
export function WindParticles({ windSpeed, windDirection, color }: WindParticlesProps) {
  const isDark = useIsDark()
  const stateRef = useRef<WindState | null>(null)

  const drawRef = useRef<DrawFn>((ctx, W, H) => {
    const s = stateRef.current
    if (!s) return

    for (const p of s.particles) {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - s.dx * p.length, p.y - s.dy * p.length)

      const grad = ctx.createLinearGradient(p.x, p.y, p.x - s.dx * p.length, p.y - s.dy * p.length)
      grad.addColorStop(0, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${p.opacity})`)
      grad.addColorStop(1, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},0)`)

      ctx.strokeStyle = grad
      ctx.lineWidth = 1.2
      ctx.stroke()

      p.x += s.dx * p.speed * 2
      p.y += s.dy * p.speed * 2

      if (p.x < -50) p.x = W + 50
      if (p.x > W + 50) p.x = -50
      if (p.y < -50) p.y = H + 50
      if (p.y > H + 50) p.y = -50
    }
  })

  const onResizeRef = useRef<ResizeFn>((W, H) => {
    const s = stateRef.current
    if (!s) return
    for (const p of s.particles) {
      p.x = Math.random() * W
      p.y = Math.random() * H
    }
  })

  // Re-initialise state when wind props or colour changes
  useEffect(() => {
    const count = Math.max(6, Math.min(40, Math.floor(windSpeed * 0.8)))
    const baseSpeed = Math.max(0.4, windSpeed / 20)
    const rad = ((windDirection + 180) % 360) * (Math.PI / 180)
    const dx = Math.sin(rad)
    const dy = -Math.cos(rad)

    stateRef.current = {
      particles: Array.from({ length: count }, () => ({
        x: Math.random() * 300,
        y: Math.random() * 200,
        length: 10 + Math.random() * 30,
        opacity: 0.3,
        speed: baseSpeed * (0.7 + Math.random() * 0.6),
      })),
      dx,
      dy,
      rgb: resolveColorToRgb(color),
    }
  }, [windSpeed, windDirection, color, isDark])

  const canvasRef = useCanvasAnimation(drawRef, onResizeRef)

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
      style={{ opacity: windSpeed < 5 ? 0.3 : 1 }}
    />
  )
}
