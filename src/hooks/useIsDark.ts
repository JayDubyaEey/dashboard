import { useState, useEffect } from "react"

/**
 * Tracks whether the `.dark` class is currently applied to `<html>`.
 * Responds to both OS preference changes and forced-mode backgrounds set
 * by useTheme — unlike a plain matchMedia listener.
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
