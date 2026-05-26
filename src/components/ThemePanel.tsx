import { Sun, Moon, Monitor, Palette, X } from "lucide-react"
import { type ThemeMode, type ForcedMode, BACKGROUNDS } from "@/lib/themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ThemePanelProps {
  mode: ThemeMode
  backgroundId: string
  forcedMode: ForcedMode
  onModeChange: (m: ThemeMode) => void
  onBackgroundChange: (id: string) => void
  onClose: () => void
}

interface ThemeTriggerProps {
  open: boolean
  onToggle: () => void
}

const MODES: {
  value: ThemeMode
  Icon: React.ComponentType<{ className?: string }>
  label: string
}[] = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "system", Icon: Monitor, label: "System" },
  { value: "dark", Icon: Moon, label: "Dark" },
]

export function ThemeTrigger({ open, onToggle }: ThemeTriggerProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 hover:text-foreground transition-colors",
        open && "text-foreground"
      )}
      aria-label="Theme settings"
    >
      <Palette className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Appearance</span>
    </button>
  )
}

export function ThemePanel({
  mode,
  backgroundId,
  forcedMode,
  onModeChange,
  onBackgroundChange,
  onClose,
}: ThemePanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Appearance
        </CardTitle>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close appearance settings"
        >
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mode toggle */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Mode
            {forcedMode && (
              <span className="ml-2 normal-case font-normal opacity-60">
                (forced by background)
              </span>
            )}
          </p>
          <div
            className={cn(
              "grid grid-cols-3 gap-1 p-1 rounded-lg bg-secondary",
              forcedMode && "opacity-40 pointer-events-none select-none"
            )}
          >
            {MODES.map(({ value, Icon, label }) => {
              const active = forcedMode ? value === forcedMode : mode === value
              return (
                <button
                  key={value}
                  onClick={() => onModeChange(value)}
                  disabled={!!forcedMode}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Background picker */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Background
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onBackgroundChange(bg.id)}
                title={bg.label}
                className={cn(
                  "group relative h-10 rounded-lg overflow-hidden border-2 transition-all",
                  backgroundId === bg.id
                    ? "border-primary scale-105 shadow-md"
                    : "border-transparent hover:border-muted-foreground"
                )}
              >
                {/* Swatch */}
                {bg.id === "default" ? (
                  <div className="w-full h-full bg-background flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-secondary border border-border" />
                  </div>
                ) : (
                  <div className="w-full h-full" style={{ background: bg.preview }} />
                )}
                {/* Active check */}
                {backgroundId === bg.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/80 shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {/* Label for selected background */}
          <p className="text-xs text-muted-foreground text-center">
            {BACKGROUNDS.find((b) => b.id === backgroundId)?.label}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
