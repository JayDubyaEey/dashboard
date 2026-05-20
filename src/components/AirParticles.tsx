import { useEffect, useRef } from "react"
import { useCanvasAnimation, type DrawFn, type ResizeFn } from "@/hooks/useCanvasAnimation"
import { getAqiLabel } from "@/lib/airQuality"

interface AirParticlesProps {
  aqi: number
}

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  opacity: number
  wobbleOffset: number
  wobbleSpeed: number
}

interface AirState {
  particles: Particle[]
  chaos: number
  rgb: [number, number, number]
}

export function AirParticles({ aqi }: AirParticlesProps) {
  const stateRef = useRef<AirState | null>(null)

  const drawRef = useRef<DrawFn>((ctx, W, H, t) => {
    const s = stateRef.current
    if (!s) return

    for (const p of s.particles) {
      const wobble = Math.sin(t * p.wobbleSpeed + p.wobbleOffset) * s.chaos * 0.6

      ctx.beginPath()
      ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2)

      const grd = ctx.createRadialGradient(p.x + wobble, p.y, 0, p.x + wobble, p.y, p.r)
      grd.addColorStop(0, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${p.opacity})`)
      grd.addColorStop(1, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},0)`)
      ctx.fillStyle = grd
      ctx.fill()

      p.x += p.vx
      p.y += p.vy

      if (p.y + p.r < 0) p.y = H + p.r
      if (p.x - p.r > W) p.x = -p.r
      if (p.x + p.r < 0) p.x = W + p.r
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

  // Re-initialise state when AQI changes
  useEffect(() => {
    const { color } = getAqiLabel(aqi)
    const rgb: [number, number, number] = [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ]

    const count = Math.max(6, Math.min(70, Math.floor(aqi * 0.7)))
    const baseSpeed = Math.max(0.1, Math.min(1.4, aqi * 0.012))
    const maxRadius = Math.max(1.5, Math.min(4.5, aqi * 0.04))
    const chaos = Math.min(1, aqi / 80)

    stateRef.current = {
      particles: Array.from({ length: count }, () => ({
        x: Math.random() * 300,
        y: Math.random() * 200,
        r: 0.8 + Math.random() * maxRadius,
        vx: (Math.random() - 0.5) * chaos * 0.8,
        vy: -(0.15 + Math.random() * baseSpeed),
        opacity: 0.3,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.003 + Math.random() * 0.006 * chaos,
      })),
      chaos,
      rgb,
    }
  }, [aqi])

  const canvasRef = useCanvasAnimation(drawRef, onResizeRef)

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
    />
  )
}
