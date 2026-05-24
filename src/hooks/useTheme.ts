import { useState, useEffect, useCallback } from "react"
import { type ThemeMode, BACKGROUNDS } from "@/lib/themes"

function parseMode(raw: string | null): ThemeMode {
  if (raw === "light" || raw === "dark" || raw === "system") return raw
  return "system"
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true
  if (mode === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyDark(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark)
}

const STORAGE_MODE = "dashboard-theme-mode"
const STORAGE_BG = "dashboard-theme-bg"

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => parseMode(localStorage.getItem(STORAGE_MODE)))

  const [backgroundId, setBackgroundId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_BG) ?? "default"
  })

  const background = BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0]

  // Apply dark class — forcedMode from background takes precedence over user mode
  useEffect(() => {
    // Set data-bg attribute for CSS variable overrides
    document.documentElement.setAttribute("data-bg", background.id)

    if (background.forcedMode !== null) {
      applyDark(background.forcedMode === "dark")
      return
    }

    applyDark(resolveIsDark(mode))

    if (mode !== "system") return

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyDark(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, background])

  const setThemeMode = useCallback((m: ThemeMode) => {
    setMode(m)
    localStorage.setItem(STORAGE_MODE, m)
  }, [])

  const setBackground = useCallback((id: string) => {
    setBackgroundId(id)
    localStorage.setItem(STORAGE_BG, id)
  }, [])

  return { mode, setThemeMode, background, backgroundId, setBackground }
}
