import { useEffect, useRef } from "react"
import { useCanvasAnimation, type DrawFn } from "@/hooks/useCanvasAnimation"

interface WeatherAnimationProps {
  weatherCode: number
}

type AnimationType = "sunRays" | "clouds" | "fog" | "rain" | "heavyRain" | "snow" | "storm"

interface CloudShape {
  x: number
  y: number
  r: number
  speed: number
  opacity: number
}

interface RainDrop {
  x: number
  y: number
  speed: number
  length: number
  opacity: number
}

interface Snowflake {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  phase: number
  opacity: number
}

interface FogStrip {
  x: number
  y: number
  width: number
  height: number
  speed: number
  opacity: number
}

interface WeatherState {
  type: AnimationType
  clouds: CloudShape[]
  drops: RainDrop[]
  flakes: Snowflake[]
  fogStrips: FogStrip[]
  lastFlash: { value: number; active: boolean }
}

/**
 * Maps WMO weather codes to animation types:
 *  0-2   → sunRays
 *  3     → clouds
 *  45-48 → fog
 *  51-67 → rain
 *  71-77 → snow
 *  80-82 → heavyRain
 *  95-99 → storm
 */
function getAnimationType(code: number): AnimationType {
  if (code === 0 || code === 1) return "sunRays"
  if (code === 2 || code === 3) return "clouds"
  if (code === 45 || code === 48) return "fog"
  if (code >= 51 && code <= 67) return "rain"
  if (code >= 71 && code <= 77) return "snow"
  if (code >= 80 && code <= 82) return "heavyRain"
  if (code >= 95) return "storm"
  return "clouds"
}

function initWeatherState(type: AnimationType, W: number, H: number): WeatherState {
  return {
    type,
    clouds: Array.from({ length: 4 }, (_, i) => ({
      x: (W / 4) * i,
      y: 15 + Math.random() * 30,
      r: 12 + Math.random() * 14,
      speed: 0.2 + Math.random() * 0.3,
      opacity: 0.06 + Math.random() * 0.06,
    })),
    drops: Array.from({ length: type === "heavyRain" || type === "storm" ? 60 : 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 3 + Math.random() * 4,
      length: 8 + Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.2,
    })),
    flakes: Array.from({ length: 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.5 + Math.random() * 2.5,
      speed: 0.5 + Math.random() * 1,
      drift: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.3 + Math.random() * 0.4,
    })),
    fogStrips: Array.from({ length: 5 }, (_, i) => ({
      x: -100 + i * 80,
      y: 20 + i * 15,
      width: 100 + Math.random() * 80,
      height: 20 + Math.random() * 20,
      speed: 0.15 + Math.random() * 0.25,
      opacity: 0.05 + Math.random() * 0.08,
    })),
    lastFlash: { value: 0, active: false },
  }
}

// ─── Individual renderers ─────────────────────────────────────────────────────

function animateSunRays(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const cx = W * 0.75
  const cy = H * 0.25

  // Draw soft glow layers
  for (let layer = 0; layer < 3; layer++) {
    const radius = 15 + layer * 8
    const alpha = (0.15 - layer * 0.04) * (0.8 + Math.sin(t * 0.0008) * 0.2)
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grd.addColorStop(0, `rgba(252, 211, 77, ${alpha})`)
    grd.addColorStop(0.6, `rgba(252, 211, 77, ${alpha * 0.4})`)
    grd.addColorStop(1, "rgba(252, 211, 77, 0)")
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.fill()
  }

  // Draw smooth animated rays with soft, diffused appearance
  const numRays = 12
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2 + t * 0.0006
    const pulseAmount = Math.sin(t * 0.0008 + i * 0.5) * 2
    const inner = 20
    const outer = 40 + pulseAmount

    // Create a gradient for each ray to make it softer
    const rayGradient = ctx.createLinearGradient(
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner,
      cx + Math.cos(angle) * outer,
      cy + Math.sin(angle) * outer
    )
    const rayAlpha = 0.12 + Math.sin(t * 0.0008 + i * 0.5) * 0.06
    rayGradient.addColorStop(0, `rgba(252, 211, 77, ${rayAlpha * 0.3})`)
    rayGradient.addColorStop(0.5, `rgba(252, 211, 77, ${rayAlpha})`)
    rayGradient.addColorStop(1, `rgba(252, 211, 77, 0)`)

    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
    ctx.strokeStyle = rayGradient
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    ctx.stroke()
  }

  // Draw bright core
  const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18)
  coreGradient.addColorStop(0, "rgba(255, 235, 130, 0.35)")
  coreGradient.addColorStop(0.5, `rgba(252, 211, 77, ${0.25 + Math.sin(t * 0.0008) * 0.08})`)
  coreGradient.addColorStop(1, "rgba(252, 211, 77, 0.05)")
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fillStyle = coreGradient
  ctx.fill()
}

function animateClouds(ctx: CanvasRenderingContext2D, W: number, clouds: CloudShape[]) {
  for (const c of clouds) {
    ctx.beginPath()
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
    ctx.arc(c.x + c.r * 0.7, c.y - c.r * 0.3, c.r * 0.75, 0, Math.PI * 2)
    ctx.arc(c.x + c.r * 1.4, c.y, c.r * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(148, 163, 184, ${c.opacity})`
    ctx.fill()

    c.x += c.speed
    if (c.x - c.r * 2 > W) c.x = -c.r * 3
  }
}

function animateRain(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  drops: RainDrop[],
  heavy: boolean
) {
  for (const d of drops) {
    ctx.beginPath()
    ctx.moveTo(d.x, d.y)
    ctx.lineTo(d.x - d.length * 0.2, d.y + d.length)
    ctx.strokeStyle = `rgba(147, 197, 253, ${d.opacity})`
    ctx.lineWidth = heavy ? 1.5 : 1
    ctx.stroke()

    d.y += d.speed
    d.x -= d.speed * 0.15

    if (d.y > H + 20) {
      d.y = -20
      d.x = Math.random() * W
    }
  }
}

function animateSnow(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  flakes: Snowflake[],
  t: number
) {
  for (const f of flakes) {
    ctx.beginPath()
    ctx.arc(f.x + Math.sin(t * 0.001 + f.phase) * 3, f.y, f.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(219, 234, 254, ${f.opacity})`
    ctx.fill()

    f.y += f.speed
    f.x += f.drift * 0.3

    if (f.y > H + 10) {
      f.y = -10
      f.x = Math.random() * W
    }
  }
}

function animateFog(ctx: CanvasRenderingContext2D, W: number, strips: FogStrip[], t: number) {
  for (const s of strips) {
    const alpha = s.opacity * (0.8 + Math.sin(t * 0.001 + s.x) * 0.2)
    const grd = ctx.createLinearGradient(s.x, 0, s.x + s.width, 0)
    grd.addColorStop(0, `rgba(148, 163, 184, 0)`)
    grd.addColorStop(0.3, `rgba(148, 163, 184, ${alpha})`)
    grd.addColorStop(0.7, `rgba(148, 163, 184, ${alpha})`)
    grd.addColorStop(1, `rgba(148, 163, 184, 0)`)
    ctx.fillStyle = grd
    ctx.fillRect(s.x, s.y, s.width, s.height)

    s.x += s.speed
    if (s.x > W + s.width) s.x = -s.width
  }
}

function animateStorm(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  drops: RainDrop[],
  t: number,
  lastFlashRef: { value: number; active: boolean }
) {
  animateRain(ctx, W, H, drops, true)

  if (!lastFlashRef.active && Math.random() < 0.002) {
    lastFlashRef.active = true
    lastFlashRef.value = t
  }
  if (lastFlashRef.active) {
    const elapsed = t - lastFlashRef.value
    if (elapsed < 120) {
      const alpha = Math.max(0, 0.12 - elapsed * 0.001)
      ctx.fillStyle = `rgba(196, 181, 253, ${alpha})`
      ctx.fillRect(0, 0, W, H)

      if (elapsed < 60) {
        const bx = W * 0.6
        ctx.beginPath()
        ctx.moveTo(bx, 0)
        ctx.lineTo(bx - 8, H * 0.35)
        ctx.lineTo(bx + 4, H * 0.35)
        ctx.lineTo(bx - 6, H * 0.7)
        ctx.strokeStyle = `rgba(233, 213, 255, ${0.5 - elapsed * 0.006})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    } else {
      lastFlashRef.active = false
    }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeatherAnimation({ weatherCode }: WeatherAnimationProps) {
  const stateRef = useRef<WeatherState | null>(null)

  const drawRef = useRef<DrawFn>((ctx, W, H, t) => {
    const s = stateRef.current
    if (!s) return
    switch (s.type) {
      case "sunRays":
        animateSunRays(ctx, W, H, t)
        break
      case "clouds":
        animateClouds(ctx, W, s.clouds)
        break
      case "fog":
        animateFog(ctx, W, s.fogStrips, t)
        break
      case "rain":
        animateRain(ctx, W, H, s.drops, false)
        break
      case "heavyRain":
        animateRain(ctx, W, H, s.drops, true)
        break
      case "snow":
        animateSnow(ctx, W, H, s.flakes, t)
        break
      case "storm":
        animateStorm(ctx, W, H, s.drops, t, s.lastFlash)
        break
    }
  })

  // Re-initialise particle state whenever the animation type changes
  useEffect(() => {
    stateRef.current = initWeatherState(getAnimationType(weatherCode), 300, 200)
  }, [weatherCode])

  const canvasRef = useCanvasAnimation(drawRef)

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
    />
  )
}
