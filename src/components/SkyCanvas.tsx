import { useLayoutEffect, useRef } from "react"
import { useCanvasAnimation, type DrawFn } from "@/hooks/useCanvasAnimation"

interface SkyCanvasProps {
  progress: number // 0–1 position through daylight
  isDaytime: boolean
  sunProgress: number // clamped 0–1 for above-horizon sun arc
  isDark: boolean // system dark mode
  apexRatio: number // 0–1 fraction of canvas height for arc apex
  sunElevationDeg: number // actual sun elevation in degrees (negative = below horizon)
  nightProgress: number // 0–1 through the night (0=just set, 0.5=midnight, 1=about to rise)
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
  const baseY = H * 0.78
  const x0 = m,
    x2 = W - m,
    cx = W / 2,
    cy = apexY
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2
  const y = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * cy + t * t * baseY
  return [x, y]
}

function arcPartialCP(
  W: number,
  H: number,
  t: number,
  apexRatio: number
): [number, number, number, number] {
  const m = W * ARC_MARGIN_RATIO
  const baseY = H * 0.78
  const apexY = H * apexRatio
  const x0 = m,
    cx = W / 2,
    cpy = apexY
  const cpx1 = (1 - t) * x0 + t * cx
  const cpy1 = (1 - t) * baseY + t * cpy
  return [cpx1, cpy1, ...arcPoint(W, H, t, apexRatio)]
}

/**
 * Point on the below-horizon arc.
 * t=0 → right edge (sunset/west), t=0.5 → nadir (midnight), t=1 → left edge (sunrise/east)
 */
function belowArcPoint(W: number, H: number, t: number, nadirRatio: number): [number, number] {
  const m = W * ARC_MARGIN_RATIO
  const baseY = H * 0.78
  const nadirY = H * nadirRatio
  const x0 = W - m,
    x2 = m,
    cx = W / 2,
    cy = nadirY
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2
  const y = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * cy + t * t * baseY
  return [x, y]
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
    nightProgress: number
  }
) {
  const { progress, isDaytime, sunProgress, isDark, t, apexRatio, sunElevationDeg, nightProgress } =
    opts

  const baseY = H * 0.78

  const nadirRatio = Math.min(0.96, 0.78 + (0.78 - apexRatio))

  // 1. Sky gradient
  const [topRgb, botRgb] = getSkyStops(progress, isDaytime, isDark)
  const skyGrd = ctx.createLinearGradient(0, 0, 0, baseY)
  skyGrd.addColorStop(0, lerpColor(topRgb, botRgb, 0))
  skyGrd.addColorStop(1, lerpColor(topRgb, botRgb, 1))
  ctx.fillStyle = skyGrd
  ctx.fillRect(0, 0, W, baseY)

  // 2. Atmospheric haze toward horizon
  const hazeGrd = ctx.createLinearGradient(0, H * 0.45, 0, baseY)
  hazeGrd.addColorStop(0, "rgba(255,255,255,0.00)")
  hazeGrd.addColorStop(1, `rgba(255,255,255,${isDaytime ? 0.07 : 0.02})`)
  ctx.fillStyle = hazeGrd
  ctx.fillRect(0, 0, W, baseY)

  // 3. Horizon glow when sun is near horizon (above)
  if (isDaytime && (progress < 0.18 || progress > 0.82)) {
    const strength = progress < 0.18 ? (0.18 - progress) / 0.18 : (progress - 0.82) / 0.18
    const [hsx] = arcPoint(W, H, sunProgress, apexRatio)
    const hgrd = ctx.createRadialGradient(hsx, baseY, 0, hsx, baseY, W * 0.45)
    hgrd.addColorStop(0, `rgba(255,150,50,${0.28 * strength})`)
    hgrd.addColorStop(0.5, `rgba(255,80,20,${0.1 * strength})`)
    hgrd.addColorStop(1, "rgba(255,60,0,0)")
    ctx.fillStyle = hgrd
    ctx.fillRect(0, 0, W, baseY)
  }

  // 4. Stars — night only
  if (!isDaytime) {
    for (let i = 0; i < STARS.length; i++) {
      const [fx, fy, r] = STARS[i]
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.00055 + i * 1.7))
      ctx.beginPath()
      ctx.arc(fx * W, fy * H * 0.75, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220,230,255,${twinkle})`
      ctx.fill()
    }
  }

  // 5. Subtle cloud wisps (daytime only)
  if (isDaytime && progress > 0.1 && progress < 0.9) {
    const cloudAlpha =
      Math.min(1, (progress - 0.1) / 0.15) * Math.min(1, (0.9 - progress) / 0.1) * 0.045
    const clouds = [
      { x: 0.2, y: 0.22, rx: 0.15, ry: 0.045 },
      { x: 0.62, y: 0.14, rx: 0.18, ry: 0.05 },
      { x: 0.85, y: 0.3, rx: 0.1, ry: 0.035 },
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

  // 7. Elapsed arc (solid, warm)
  if (isDaytime && progress > 0.005) {
    const [cpx1, cpy1, ex, ey] = arcPartialCP(W, H, Math.min(progress, 0.999), apexRatio)
    const arcGrd = ctx.createLinearGradient(m, 0, ex, 0)
    arcGrd.addColorStop(0, "rgba(255,150,50,0.6)")
    arcGrd.addColorStop(1, `${sunColor(progress, isDaytime)}99`)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(m, baseY)
    ctx.quadraticCurveTo(cpx1, cpy1, ex, ey)
    ctx.strokeStyle = arcGrd
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.stroke()
    ctx.restore()
  }

  // 8. Sun / Moon (above horizon)
  const [sx, sy] = arcPoint(W, H, sunProgress, apexRatio)
  const sc = sunColor(progress, isDaytime)
  const radius = isDaytime ? 15 : 9

  if (isDaytime) {
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
  } else {
    const moonGlow = ctx.createRadialGradient(sx, sy, radius * 0.8, sx, sy, radius + 10)
    moonGlow.addColorStop(0, "rgba(200,220,255,0.25)")
    moonGlow.addColorStop(1, "rgba(200,220,255,0.00)")
    ctx.beginPath()
    ctx.arc(sx, sy, radius + 10, 0, Math.PI * 2)
    ctx.fillStyle = moonGlow
    ctx.fill()

    const moonGrd = ctx.createRadialGradient(
      sx - radius * 0.2,
      sy - radius * 0.2,
      0,
      sx,
      sy,
      radius
    )
    moonGrd.addColorStop(0, "rgba(230, 240, 255, 1.0)")
    moonGrd.addColorStop(0.6, "rgba(200, 215, 240, 1.0)")
    moonGrd.addColorStop(1.0, "rgba(160, 180, 210, 1.0)")
    ctx.beginPath()
    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
    ctx.fillStyle = moonGrd
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.beginPath()
    ctx.arc(sx + radius * 0.55, sy - radius * 0.1, radius * 0.85, 0, Math.PI * 2)
    ctx.fillStyle = lerpColor(topRgb, botRgb, 0.3)
    ctx.fill()
    ctx.restore()
  }

  // ── 9. Below-horizon scene ─────────────────────────────────────────────────

  // Gradient earth — transparent at horizon so the sky colour bleeds through,
  // then deepens to near-black at the very bottom
  const earthGrd = ctx.createLinearGradient(0, baseY, 0, H)
  earthGrd.addColorStop(0, "rgba(12,10,22,0)")
  earthGrd.addColorStop(0.25, "rgba(12,10,22,0.55)")
  earthGrd.addColorStop(0.6, "rgba(6,5,14,0.88)")
  earthGrd.addColorStop(1, "rgba(3,3,8,1)")
  ctx.fillStyle = earthGrd
  ctx.fillRect(0, baseY, W, H - baseY)

  const elev = sunElevationDeg
  if (elev < 0 && elev > -18) {
    const e = Math.abs(elev)
    let cr: number, cg: number, cb: number, alpha: number
    if (e <= 6) {
      const tt = e / 6
      cr = Math.round(255 - tt * 80)
      cg = Math.round(110 - tt * 90)
      cb = Math.round(30 + tt * 30)
      alpha = 0.9 - tt * 0.5
    } else if (e <= 12) {
      const tt = (e - 6) / 6
      cr = 50
      cg = 20
      cb = 100
      alpha = 0.4 - tt * 0.28
    } else {
      const tt = (e - 12) / 6
      cr = 15
      cg = 10
      cb = 40
      alpha = 0.12 - tt * 0.1
    }
    const glowGrd = ctx.createLinearGradient(0, baseY, 0, baseY + (H - baseY) * 0.65)
    glowGrd.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`)
    glowGrd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    ctx.fillStyle = glowGrd
    ctx.fillRect(0, baseY, W, H - baseY)
  }

  if (!isDaytime) {
    const [bsx, bsy] = belowArcPoint(W, H, nightProgress, nadirRatio)
    if (bsy < H - 2 && bsy > baseY) {
      const elevFade = Math.max(0, Math.min(1, (elev + 18) / 18))
      const discAlpha = 0.15 + elevFade * 0.65

      const cr = Math.round(220 + elevFade * 35)
      const cg = Math.round(80 + elevFade * 60)
      const cb = Math.round(80 - elevFade * 50)

      const glowR = 8 + elevFade * 10
      const bGlow = ctx.createRadialGradient(bsx, bsy, 0, bsx, bsy, glowR + 8)
      bGlow.addColorStop(0, `rgba(${cr},${cg},${cb},${(discAlpha * 0.7).toFixed(3)})`)
      bGlow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.beginPath()
      ctx.arc(bsx, bsy, glowR + 8, 0, Math.PI * 2)
      ctx.fillStyle = bGlow
      ctx.fill()

      ctx.beginPath()
      ctx.arc(bsx, bsy, Math.max(3, glowR * 0.45), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${discAlpha.toFixed(3)})`
      ctx.fill()
    }
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SkyCanvas({
  progress,
  isDaytime,
  sunProgress,
  isDark,
  apexRatio,
  sunElevationDeg,
  nightProgress,
}: SkyCanvasProps) {
  const progressRef = useRef(progress)
  const isDaytimeRef = useRef(isDaytime)
  const sunProgressRef = useRef(sunProgress)
  const isDarkRef = useRef(isDark)
  const apexRatioRef = useRef(apexRatio)
  const sunElevationRef = useRef(sunElevationDeg)
  const nightProgressRef = useRef(nightProgress)

  // Sync all animated props into refs before the next paint — satisfies react-hooks/refs
  // while keeping the animation loop stable (loop started once, reads via refs)
  useLayoutEffect(() => {
    progressRef.current = progress
    isDaytimeRef.current = isDaytime
    sunProgressRef.current = sunProgress
    isDarkRef.current = isDark
    apexRatioRef.current = apexRatio
    sunElevationRef.current = sunElevationDeg
    nightProgressRef.current = nightProgress
  })

  const drawRef = useRef<DrawFn>((ctx, W, H, t) => {
    drawSkyFrame(ctx, W, H, {
      progress: progressRef.current,
      isDaytime: isDaytimeRef.current,
      sunProgress: sunProgressRef.current,
      isDark: isDarkRef.current,
      apexRatio: apexRatioRef.current,
      sunElevationDeg: sunElevationRef.current,
      nightProgress: nightProgressRef.current,
      t,
    })
  })

  const canvasRef = useCanvasAnimation(drawRef)

  return <canvas ref={canvasRef} className="w-full h-full rounded-t-xl pointer-events-none block" />
}
