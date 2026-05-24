import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Finds the first band whose threshold exceeds `value`.
 * Bands are `[threshold, ...rest]` tuples sorted ascending.
 * Falls back to the last band if `value` exceeds all thresholds.
 */
export function findBand<T extends readonly [number, ...unknown[]]>(
  bands: readonly T[],
  value: number
): T {
  return (bands.find(([thresh]) => value < thresh) ?? bands[bands.length - 1]) as T
}

/**
 * Converts a millisecond duration to a `"Xh Ym"` string.
 */
export function formatMsToHM(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}
