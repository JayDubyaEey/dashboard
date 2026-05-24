import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flower2 } from "lucide-react"
import { findBand } from "@/lib/utils"

interface PollenData {
  alder: number | null
  birch: number | null
  grass: number | null
  mugwort: number | null
  olive: number | null
  ragweed: number | null
}

interface AllergyCardProps {
  pollen: PollenData
}

const BANDS: [number, string, string][] = [
  [10, "#4ade80", "Low"],
  [30, "#facc15", "Moderate"],
  [80, "#fb923c", "High"],
  [Infinity, "#f87171", "Very High"],
]

function getPollenInfo(value: number | null) {
  if (value === null) return { color: "#6b7280", status: "N/A" }
  const [, color, status] = findBand(BANDS, value)
  return { color, status }
}

const GROUPS: {
  label: string
  members: { key: keyof PollenData; name: string }[]
}[] = [
  {
    label: "Grass",
    members: [{ key: "grass", name: "Grass" }],
  },
  {
    label: "Trees",
    members: [
      { key: "alder", name: "Alder" },
      { key: "birch", name: "Birch" },
      { key: "olive", name: "Olive" },
    ],
  },
  {
    label: "Plants",
    members: [
      { key: "mugwort", name: "Mugwort" },
      { key: "ragweed", name: "Ragweed" },
    ],
  },
]

const BAR_MAX = 80

export function AllergyCard({ pollen }: AllergyCardProps) {
  const allNull = Object.values(pollen).every((v) => v === null)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flower2 className="w-4 h-4" />
          Pollen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allNull ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 py-6">
            <Flower2 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Pollen data is only available in Europe.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {GROUPS.map(({ label, members }) => {
              // Find the dominant member (highest value)
              const resolved = members.map((m) => ({ ...m, value: pollen[m.key] ?? 0 }))
              const dominant = resolved.reduce((a, b) => (b.value > a.value ? b : a))
              const groupValue = dominant.value
              const { color, status } = getPollenInfo(groupValue)
              const barPct = Math.min(groupValue / BAR_MAX, 1) * 100

              return (
                <div key={label} className="space-y-1.5">
                  {/* Header row */}
                  <div className="flex items-baseline justify-between text-sm">
                    <div>
                      <span className="font-medium">{label}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">
                        {members.map((m) => m.name).join(", ")}
                      </span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                      {Math.round(groupValue)} g/m³
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-none"
                      style={{ width: `${barPct}%`, background: color }}
                    />
                  </div>

                  {/* Subtext */}
                  <div className="text-xs" style={{ color }}>
                    {status}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
