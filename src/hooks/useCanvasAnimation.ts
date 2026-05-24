import { useEffect, useRef } from "react"

export type DrawFn = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => void
export type ResizeFn = (W: number, H: number) => void

/**
 * Shared canvas animation loop.
 *
 * Handles canvas sizing via ResizeObserver and drives a requestAnimationFrame
 * loop. Callers pass a stable `drawRef` (mutated via useLayoutEffect) so the
 * loop never needs to restart when props change.
 *
 * @param drawRef     - Ref to the per-frame draw function. Read each frame.
 * @param onResizeRef - Optional ref to a callback fired whenever the canvas
 *                      is resized (use to re-scatter particles etc.).
 * @returns A ref to attach to the <canvas> element.
 */
export function useCanvasAnimation(
  drawRef: React.RefObject<DrawFn>,
  onResizeRef?: React.RefObject<ResizeFn>
): React.RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const sizeRef = useRef({ W: 0, H: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (W !== sizeRef.current.W || H !== sizeRef.current.H) {
        canvas.width = W
        canvas.height = H
        sizeRef.current = { W, H }
        onResizeRef?.current?.(W, H)
      }
    }

    const tick = (t: number) => {
      const { W, H } = sizeRef.current
      if (W > 0 && H > 0) {
        ctx.clearRect(0, 0, W, H)
        drawRef.current?.(ctx, W, H, t)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
    }
    // drawRef and onResizeRef are stable ref objects — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return canvasRef
}
