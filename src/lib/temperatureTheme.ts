/** Returns a temperature label based on feels-like temperature (°C). */
export function getTemperatureLabel(feelsLike: number): string {
  if (feelsLike <= 0) return "Freezing"
  if (feelsLike <= 8) return "Cold"
  if (feelsLike <= 15) return "Mild"
  if (feelsLike <= 22) return "Warm"
  return "Hot"
}
