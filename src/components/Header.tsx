import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGardenStore } from '@/store/garden'

export function Header(): JSX.Element {
  const { garden, setGardenName, setGardenWidth, setGardenHeight } = useGardenStore()

  return (
    <header className="flex items-center gap-4 border-b bg-background px-4 py-2">
      <span className="text-sm font-semibold text-foreground">Green Grid</span>

      <div className="flex items-center gap-2">
        <Label htmlFor="garden-name">Garden</Label>
        <Input
          id="garden-name"
          value={garden.name}
          onChange={(e) => setGardenName(e.target.value)}
          className="w-48"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="garden-width">Width (m)</Label>
        <Input
          id="garden-width"
          type="number"
          min={1}
          max={100}
          value={garden.widthMeters}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val) && val >= 1 && val <= 100) setGardenWidth(val)
          }}
          className="w-20"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="garden-height">Height (m)</Label>
        <Input
          id="garden-height"
          type="number"
          min={1}
          max={100}
          value={garden.heightMeters}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val) && val >= 1 && val <= 100) setGardenHeight(val)
          }}
          className="w-20"
        />
      </div>
    </header>
  )
}
