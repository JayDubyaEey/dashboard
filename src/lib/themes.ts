export type ThemeMode = "light" | "dark" | "system"
export type ForcedMode = "dark" | "light" | null

export interface Background {
  id: string
  label: string
  /** CSS background value applied to the page wrapper */
  value: string
  /** Gradient string for the swatch preview */
  preview: string
  forcedMode: ForcedMode
}

export const BACKGROUNDS: Background[] = [
  {
    id: "default",
    label: "Default",
    value: "",
    preview: "bg-background",
    forcedMode: null,
  },
  {
    id: "midnight",
    label: "Midnight",
    value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    preview: "linear-gradient(135deg, #0f0c29, #302b63)",
    forcedMode: "dark",
  },
  {
    id: "aurora",
    label: "Aurora",
    value: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 40%, #1e3a5f 100%)",
    preview: "linear-gradient(135deg, #0d1b2a, #1b4332)",
    forcedMode: "dark",
  },
  {
    id: "dusk",
    label: "Dusk",
    value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #4a1942 100%)",
    preview: "linear-gradient(135deg, #1a1a2e, #4a1942)",
    forcedMode: "dark",
  },
  {
    id: "slate",
    label: "Slate",
    value: "linear-gradient(135deg, #1e2a3a 0%, #2d3748 100%)",
    preview: "linear-gradient(135deg, #1e2a3a, #2d3748)",
    forcedMode: "dark",
  },
  {
    id: "ember",
    label: "Ember",
    value: "linear-gradient(135deg, #1a0a00 0%, #3d1c02 50%, #1a0a00 100%)",
    preview: "linear-gradient(135deg, #1a0a00, #3d1c02)",
    forcedMode: "dark",
  },
  {
    id: "arctic",
    label: "Arctic",
    value: "linear-gradient(135deg, #e8f4f8 0%, #d6eaf8 50%, #eaf2f8 100%)",
    preview: "linear-gradient(135deg, #e8f4f8, #d6eaf8)",
    forcedMode: "light",
  },
  {
    id: "paper",
    label: "Paper",
    value: "linear-gradient(135deg, #fdfcfb 0%, #f5f0e8 100%)",
    preview: "linear-gradient(135deg, #fdfcfb, #f5f0e8)",
    forcedMode: "light",
  },
]
