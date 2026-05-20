export const UK_DEFAULT = { lat: 51.5074, lon: -0.1278, city: "London" }

export const SPECIAL_EVENTS = [
  { name: "Christmas", month: 12, day: 25 },
  { name: "New Year", month: 1, day: 1 },
] as const

export const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
