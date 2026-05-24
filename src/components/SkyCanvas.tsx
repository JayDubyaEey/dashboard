import { useLayoutEffect, useRef, useState, useCallback } from "react"
import { useCanvasAnimation, type DrawFn } from "@/hooks/useCanvasAnimation"
import { type MoonPhaseData } from "@/lib/astronomy"

interface SkyCanvasProps {
  progress: number // 0–1 position through daylight
  isDaytime: boolean
  sunProgress: number // clamped 0–1 for above-horizon sun arc
  isDark: boolean // system dark mode
  apexRatio: number // 0–1 fraction of canvas height for arc apex
  sunElevationDeg: number // actual sun elevation in degrees (negative = below horizon)
  moonProgress: number | null // 0–1 moon arc position at night; null if below horizon
  moonPhaseData: MoonPhaseData // current lunar phase
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

type RGB = [number, number, number]

const PALETTE = {
  night: { top: [15, 17, 35] as RGB, bot: [25, 27, 50] as RGB },
  dawn: { top: [80, 55, 80] as RGB, bot: [200, 120, 70] as RGB },
  morning: { top: [100, 140, 200] as RGB, bot: [200, 175, 130] as RGB },
  midday: { top: [80, 130, 195] as RGB, bot: [160, 210, 235] as RGB },
  afternoon: { top: [100, 140, 195] as RGB, bot: [210, 180, 120] as RGB },
  dusk: { top: [75, 50, 80] as RGB, bot: [190, 100, 60] as RGB },
  postdusk: { top: [30, 20, 45] as RGB, bot: [70, 40, 35] as RGB },
}

const PALETTE_DARK = {
  night: { top: [8, 10, 22] as RGB, bot: [14, 16, 32] as RGB },
  dawn: { top: [45, 30, 50] as RGB, bot: [120, 70, 45] as RGB },
  morning: { top: [30, 55, 95] as RGB, bot: [110, 95, 75] as RGB },
  midday: { top: [25, 60, 110] as RGB, bot: [70, 120, 160] as RGB },
  afternoon: { top: [35, 60, 100] as RGB, bot: [125, 100, 65] as RGB },
  dusk: { top: [40, 25, 50] as RGB, bot: [110, 55, 35] as RGB },
  postdusk: { top: [15, 10, 25] as RGB, bot: [35, 20, 18] as RGB },
}

// Module-level constant — positions are fractional [x, y, radius]
const STARS: [number, number, number][] = [
  [0.12, 0.12, 1.1],
  [0.28, 0.05, 0.9],
  [0.45, 0.18, 1.3],
  [0.62, 0.08, 1.0],
  [0.78, 0.2, 0.8],
  [0.88, 0.07, 1.2],
  [0.05, 0.3, 0.7],
  [0.35, 0.28, 1.0],
  [0.55, 0.35, 0.9],
  [0.72, 0.14, 1.1],
  [0.9, 0.32, 0.8],
  [0.18, 0.42, 0.6],
  [0.42, 0.1, 1.4],
  [0.65, 0.28, 0.7],
  [0.82, 0.4, 1.0],
  [0.22, 0.22, 0.9],
  [0.5, 0.06, 1.1],
  [0.7, 0.42, 0.8],
  [0.92, 0.18, 1.0],
  [0.08, 0.5, 0.7],
  [0.3, 0.48, 0.6],
  [0.58, 0.52, 0.8],
  [0.75, 0.55, 0.7],
  [0.15, 0.6, 0.9],
  [0.48, 0.62, 0.6],
]

function getSkyStops(p: number, isDaytime: boolean, isDark: boolean): [RGB, RGB] {
  const pal = isDark ? PALETTE_DARK : PALETTE
  if (!isDaytime) {
    if (p > 0.95 || p < 0) return [pal.postdusk.top, pal.postdusk.bot]
    return [pal.night.top, pal.night.bot]
  }
  if (p < 0.08) return [pal.dawn.top, pal.dawn.bot]
  if (p < 0.18) return [pal.morning.top, pal.morning.bot]
  if (p < 0.75) return [pal.midday.top, pal.midday.bot]
  if (p < 0.88) return [pal.afternoon.top, pal.afternoon.bot]
  return [pal.dusk.top, pal.dusk.bot]
}

function sunColor(p: number, isDaytime: boolean): string {
  if (!isDaytime) return "#c8d8ee"
  if (p < 0.1 || p > 0.9) return "#ff8c42"
  if (p < 0.2 || p > 0.8) return "#ffc355"
  return "#fff0a0"
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

const ARC_MARGIN_RATIO = 0.08

function arcPoint(W: number, H: number, t: number, apexRatio: number): [number, number] {
  const m = W * ARC_MARGIN_RATIO
  const apexY = H * apexRatio
  const x0 = m,
    x2 = W - m,
    cx = W / 2,
    cy = apexY
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2
  const y = (1 - t) * (1 - t) * H + 2 * (1 - t) * t * cy + t * t * H
  return [x, y]
}

function arcPartialCP(
  W: number,
  H: number,
  t: number,
  apexRatio: number
): [number, number, number, number] {
  const m = W * ARC_MARGIN_RATIO
  const apexY = H * apexRatio
  const x0 = m,
    cx = W / 2,
    cpy = apexY
  const cpx1 = (1 - t) * x0 + t * cx
  const cpy1 = (1 - t) * H + t * cpy
  return [cpx1, cpy1, ...arcPoint(W, H, t, apexRatio)]
}

// ── Moon phase disc ────────────────────────────────────────────────────────────

/**
 * Draws a moon disc with the correct phase terminator.
 *
 * Approach: fill the full disc with the lit gradient, then overlay the dark
 * (shadow) side using a semicircle + a terminator ellipse whose x-radius
 * shrinks from `r` (new/full) to 0 (quarter) and back. The ellipse either
 * "bites into" the lit side (crescent) or "extends" the lit side (gibbous).
 *
 *   phase 0.00 → new moon  (all dark)
 *   phase 0.25 → first quarter  (right half lit, waxing)
 *   phase 0.50 → full moon (all lit)
 *   phase 0.75 → last quarter  (left half lit, waning)
 */
function drawMoonPhaseDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  phase: number,
  topRgb: RGB,
  botRgb: RGB
) {
  const shadowColor = lerpColor(topRgb, botRgb, 0.25)

  const litGrd = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r)
  litGrd.addColorStop(0, "rgba(230,240,255,1.0)")
  litGrd.addColorStop(0.6, "rgba(200,215,240,1.0)")
  litGrd.addColorStop(1.0, "rgba(160,180,210,1.0)")

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // 1. Shadow background (covers whole disc)
  ctx.fillStyle = shadowColor
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

  const isWaxing = phase <= 0.5

  // 2. Lit semicircle (right for waxing, left for waning)
  ctx.fillStyle = litGrd
  ctx.beginPath()
  if (isWaxing) {
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2) // right half
  } else {
    ctx.arc(cx, cy, r, Math.PI / 2, (3 * Math.PI) / 2) // left half
  }
  ctx.closePath()
  ctx.fill()

  // 3. Terminator ellipse — rx shrinks from r→0 at quarter, expands back to r at full/new
  const terminatorRx = r * Math.abs(Math.cos(phase * Math.PI * 2))
  if (terminatorRx > 0.5) {
    if (phase <= 0.25) {
      // Waxing crescent: dark ellipse on right eats into lit semicircle
      ctx.fillStyle = shadowColor
      ctx.beginPath()
      ctx.ellipse(cx, cy, terminatorRx, r, 0, -Math.PI / 2, Math.PI / 2)
      ctx.closePath()
      ctx.fill()
    } else if (phase <= 0.5) {
      // Waxing gibbous: lit ellipse on left extends the lit area
      ctx.fillStyle = litGrd
      ctx.beginPath()
      ctx.ellipse(cx, cy, terminatorRx, r, 0, Math.PI / 2, (3 * Math.PI) / 2)
      ctx.closePath()
      ctx.fill()
    } else if (phase <= 0.75) {
      // Waning gibbous: lit ellipse on right extends the lit area
      ctx.fillStyle = litGrd
      ctx.beginPath()
      ctx.ellipse(cx, cy, terminatorRx, r, 0, -Math.PI / 2, Math.PI / 2)
      ctx.closePath()
      ctx.fill()
    } else {
      // Waning crescent: dark ellipse on left eats into lit semicircle
      ctx.fillStyle = shadowColor
      ctx.beginPath()
      ctx.ellipse(cx, cy, terminatorRx, r, 0, Math.PI / 2, (3 * Math.PI) / 2)
      ctx.closePath()
      ctx.fill()
    }
  }

  ctx.restore()
}

// ── Draw ───────────────────────────────────────────────────────────────────────

function drawSkyFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: {
    progress: number
    isDaytime: boolean
    sunProgress: number
    isDark: boolean
    t: number
    apexRatio: number
    sunElevationDeg: number
    moonProgress: number | null
    moonPhaseData: MoonPhaseData
  }
) {
  const { progress, isDaytime, sunProgress, isDark, t, apexRatio, moonProgress, moonPhaseData } =
    opts

  // 1. Sky gradient — full canvas
  const [topRgb, botRgb] = getSkyStops(progress, isDaytime, isDark)
  const skyGrd = ctx.createLinearGradient(0, 0, 0, H)
  skyGrd.addColorStop(0, lerpColor(topRgb, botRgb, 0))
  skyGrd.addColorStop(1, lerpColor(topRgb, botRgb, 1))
  ctx.fillStyle = skyGrd
  ctx.fillRect(0, 0, W, H)

  // 2. Atmospheric haze — thicker band toward the bottom
  const hazeGrd = ctx.createLinearGradient(0, H * 0.4, 0, H)
  hazeGrd.addColorStop(0, "rgba(255,255,255,0.00)")
  hazeGrd.addColorStop(1, `rgba(255,255,255,${isDaytime ? 0.1 : 0.03})`)
  ctx.fillStyle = hazeGrd
  ctx.fillRect(0, 0, W, H)

  // 3. Horizon glow when sun is near horizon
  if (isDaytime && (progress < 0.18 || progress > 0.82)) {
    const strength = progress < 0.18 ? (0.18 - progress) / 0.18 : (progress - 0.82) / 0.18
    const [hsx] = arcPoint(W, H, sunProgress, apexRatio)
    const hgrd = ctx.createRadialGradient(hsx, H, 0, hsx, H, W * 0.5)
    hgrd.addColorStop(0, `rgba(255,150,50,${0.32 * strength})`)
    hgrd.addColorStop(0.5, `rgba(255,80,20,${0.12 * strength})`)
    hgrd.addColorStop(1, "rgba(255,60,0,0)")
    ctx.fillStyle = hgrd
    ctx.fillRect(0, 0, W, H)
  }

  // 4. Vignette — subtle darkening toward all edges
  const vigR = Math.max(W, H) * 0.85
  const vig = ctx.createRadialGradient(W / 2, H / 2, vigR * 0.35, W / 2, H / 2, vigR)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(1, "rgba(0,0,0,0.22)")
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // 5. Night: nebula wash — faint diagonal Milky Way hint
  if (!isDaytime) {
    const neb = ctx.createLinearGradient(0, H * 0.05, W, H * 0.65)
    neb.addColorStop(0, "rgba(180,160,255,0.00)")
    neb.addColorStop(0.35, "rgba(180,160,255,0.045)")
    neb.addColorStop(0.65, "rgba(160,180,255,0.03)")
    neb.addColorStop(1, "rgba(160,180,255,0.00)")
    ctx.fillStyle = neb
    ctx.fillRect(0, 0, W, H)
  }

  // 6. Stars — night only, spread across upper ~65% of canvas
  if (!isDaytime) {
    for (let i = 0; i < STARS.length; i++) {
      const [fx, fy, r] = STARS[i]
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.00055 + i * 1.7))
      ctx.beginPath()
      ctx.arc(fx * W, fy * H * 0.65, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220,230,255,${twinkle})`
      ctx.fill()
    }
  }

  // 7. Cloud wisps (daytime only)
  if (isDaytime && progress > 0.1 && progress < 0.9) {
    const cloudAlpha =
      Math.min(1, (progress - 0.1) / 0.15) * Math.min(1, (0.9 - progress) / 0.1) * 0.07
    const clouds = [
      { x: 0.2, y: 0.22, rx: 0.15, ry: 0.045 },
      { x: 0.62, y: 0.14, rx: 0.18, ry: 0.05 },
      { x: 0.85, y: 0.3, rx: 0.1, ry: 0.035 },
      { x: 0.42, y: 0.38, rx: 0.13, ry: 0.04 },
    ]
    for (const c of clouds) {
      const drift = Math.sin(t * 0.00008 + c.x * 10) * 0.008
      const grd = ctx.createRadialGradient(
        (c.x + drift) * W,
        c.y * H,
        0,
        (c.x + drift) * W,
        c.y * H,
        c.rx * W
      )
      grd.addColorStop(0, `rgba(255,255,255,${cloudAlpha * 3})`)
      grd.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = grd
      ctx.save()
      ctx.scale(1, c.ry / c.rx)
      ctx.beginPath()
      ctx.arc((c.x + drift) * W, c.y * H * (c.rx / c.ry), c.rx * W, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  const m = W * ARC_MARGIN_RATIO

  // 8. Elapsed arc (solid, warm)
  if (isDaytime && progress > 0.005) {
    const [cpx1, cpy1, ex, ey] = arcPartialCP(W, H, Math.min(progress, 0.999), apexRatio)
    const arcGrd = ctx.createLinearGradient(m, 0, ex, 0)
    arcGrd.addColorStop(0, "rgba(255,150,50,0.6)")
    arcGrd.addColorStop(1, `${sunColor(progress, isDaytime)}60`)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(m, H)
    ctx.quadraticCurveTo(cpx1, cpy1, ex, ey)
    ctx.strokeStyle = arcGrd
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.stroke()
    ctx.restore()
  }

  // 9. Sun (daytime only)
  if (isDaytime) {
    const [sx, sy] = arcPoint(W, H, sunProgress, apexRatio)
    const sc = sunColor(progress, isDaytime)
    const radius = 17

    const glowR = radius + 18 + Math.sin(t * 0.0025) * 3
    const glow = ctx.createRadialGradient(sx, sy, radius * 0.9, sx, sy, glowR)
    glow.addColorStop(0, `${sc}38`)
    glow.addColorStop(1, `${sc}00`)
    ctx.beginPath()
    ctx.arc(sx, sy, glowR, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()

    const limbGrd = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius)
    limbGrd.addColorStop(0, "rgba(255, 255, 210, 1.0)")
    limbGrd.addColorStop(0.45, "rgba(255, 240, 140, 1.0)")
    limbGrd.addColorStop(0.75, "rgba(255, 200,  70, 1.0)")
    limbGrd.addColorStop(1.0, "rgba(220, 120,  20, 1.0)")
    ctx.beginPath()
    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
    ctx.fillStyle = limbGrd
    ctx.fill()

    const granules: [number, number, number][] = [
      [0.25, 0.3, 0.22],
      [-0.35, 0.1, 0.18],
      [0.1, -0.4, 0.2],
      [-0.2, -0.25, 0.15],
      [0.4, -0.15, 0.16],
      [-0.1, 0.42, 0.14],
    ]
    ctx.save()
    ctx.beginPath()
    ctx.arc(sx, sy, radius * 0.95, 0, Math.PI * 2)
    ctx.clip()
    for (const [gx, gy, gr] of granules) {
      const pulse = 0.04 + Math.abs(Math.sin(t * 0.0005 + gx * 10)) * 0.06
      const grd = ctx.createRadialGradient(
        sx + gx * radius,
        sy + gy * radius,
        0,
        sx + gx * radius,
        sy + gy * radius,
        gr * radius
      )
      grd.addColorStop(0, `rgba(160, 80, 0, ${pulse})`)
      grd.addColorStop(1, "rgba(160, 80, 0, 0)")
      ctx.beginPath()
      ctx.arc(sx + gx * radius, sy + gy * radius, gr * radius, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
    }
    ctx.restore()

    const innerGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 0.6)
    innerGlow.addColorStop(0, "rgba(255,255,240,0.30)")
    innerGlow.addColorStop(1, "rgba(255,255,240,0.00)")
    ctx.beginPath()
    ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = innerGlow
    ctx.fill()
  }

  // 10. Moon (nighttime only, when above horizon)
  if (!isDaytime && moonProgress !== null) {
    const [mx, my] = arcPoint(W, H, moonProgress, apexRatio)
    const radius = 10

    // Outer glow
    const moonGlow = ctx.createRadialGradient(mx, my, radius * 0.8, mx, my, radius + 12)
    moonGlow.addColorStop(0, `rgba(200,220,255,${0.1 + moonPhaseData.illumination * 0.2})`)
    moonGlow.addColorStop(1, "rgba(200,220,255,0.00)")
    ctx.beginPath()
    ctx.arc(mx, my, radius + 12, 0, Math.PI * 2)
    ctx.fillStyle = moonGlow
    ctx.fill()

    drawMoonPhaseDisc(ctx, mx, my, radius, moonPhaseData.phase, topRgb, botRgb)
  }
}

export function SkyCanvas({
  progress,
  isDaytime,
  sunProgress,
  isDark,
  apexRatio,
  sunElevationDeg,
  moonProgress,
  moonPhaseData,
}: SkyCanvasProps) {
  const progressRef = useRef(progress)
  const isDaytimeRef = useRef(isDaytime)
  const sunProgressRef = useRef(sunProgress)
  const isDarkRef = useRef(isDark)
  const apexRatioRef = useRef(apexRatio)
  const sunElevationRef = useRef(sunElevationDeg)
  const moonProgressRef = useRef(moonProgress)
  const moonPhaseDataRef = useRef(moonPhaseData)

  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)

  // Sync all animated props into refs before the next paint — satisfies react-hooks/refs
  // while keeping the animation loop stable (loop started once, reads via refs)
  useLayoutEffect(() => {
    progressRef.current = progress
    isDaytimeRef.current = isDaytime
    sunProgressRef.current = sunProgress
    isDarkRef.current = isDark
    apexRatioRef.current = apexRatio
    sunElevationRef.current = sunElevationDeg
    moonProgressRef.current = moonProgress
    moonPhaseDataRef.current = moonPhaseData
  })

  const drawRef = useRef<DrawFn>((ctx, W, H, t) => {
    drawSkyFrame(ctx, W, H, {
      progress: progressRef.current,
      isDaytime: isDaytimeRef.current,
      sunProgress: sunProgressRef.current,
      isDark: isDarkRef.current,
      apexRatio: apexRatioRef.current,
      sunElevationDeg: sunElevationRef.current,
      moonProgress: moonProgressRef.current,
      moonPhaseData: moonPhaseDataRef.current,
      t,
    })
  })

  const canvasRef = useCanvasAnimation(drawRef)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      const ox = e.nativeEvent.offsetX
      const oy = e.nativeEvent.offsetY

      // Check sun (daytime)
      if (isDaytimeRef.current) {
        const [sx, sy] = arcPoint(W, H, sunProgressRef.current, apexRatioRef.current)
        const dx = ox - sx,
          dy = oy - sy
        if (dx * dx + dy * dy <= (17 + 6) * (17 + 6)) {
          const elev = sunElevationRef.current
          const label =
            elev >= 0
              ? `${elev.toFixed(1)}° above horizon`
              : `${Math.abs(elev).toFixed(1)}° below horizon`
          setTooltip({ x: sx, y: sy, label })
          return
        }
      }

      // Check moon (nighttime, when visible)
      const mp = moonProgressRef.current
      if (!isDaytimeRef.current && mp !== null) {
        const [mx, my] = arcPoint(W, H, mp, apexRatioRef.current)
        const dx = ox - mx,
          dy = oy - my
        if (dx * dx + dy * dy <= (10 + 6) * (10 + 6)) {
          const { name, illumination } = moonPhaseDataRef.current
          setTooltip({
            x: mx,
            y: my,
            label: `${name} · ${Math.round(illumination * 100)}% lit`,
          })
          return
        }
      }

      setTooltip(null)
    },
    // canvasRef identity is stable; all other reads go through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-t-xl pointer-events-auto block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          <div className="rounded-md bg-black/60 backdrop-blur-sm px-2 py-1 text-xs text-white whitespace-nowrap">
            {tooltip.label}
          </div>
        </div>
      )}
    </div>
  )
}
