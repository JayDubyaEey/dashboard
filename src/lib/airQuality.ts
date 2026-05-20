/** Returns the display label and colour for a European AQI value. */
export function getAqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: "Good", color: "#22c55e" }
  if (aqi <= 40) return { label: "Fair", color: "#84cc16" }
  if (aqi <= 60) return { label: "Moderate", color: "#eab308" }
  if (aqi <= 80) return { label: "Poor", color: "#f97316" }
  if (aqi <= 100) return { label: "Very Poor", color: "#ef4444" }
  return { label: "Hazardous", color: "#7c2d12" }
}
