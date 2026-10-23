import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGardenStore, useActiveGarden } from '@/store/garden'
import { CATALOG } from '@/data/catalog'
import { exportGarden } from '@/export/exportGarden'

export function Header(): JSX.Element {
  const garden = useActiveGarden()
  const {
    gardens,
    activeGardenId,
    setGardenName,
    setGardenWidth,
    setGardenHeight,
    selectedItemId,
    rotateItem,
    deleteItem,
    duplicateItem,
    undo,
    redo,
    past,
    future,
    createGarden,
    switchGarden,
    deleteGarden,
  } = useGardenStore()

  return (
    <header className="flex items-center gap-4 border-b bg-background px-4 py-2">
      <span className="text-sm font-semibold text-foreground">Green Grid</span>

      <div className="flex items-center gap-2">
        <Label htmlFor="garden-select">Garden</Label>
        <select
          id="garden-select"
          value={activeGardenId}
          onChange={(e) => switchGarden(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Select garden"
        >
          {gardens.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={createGarden}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent"
          aria-label="New garden"
        >
          + New
        </button>
        <button
          type="button"
          onClick={() => deleteGarden(activeGardenId)}
          disabled={gardens.length <= 1}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
          aria-label="Delete garden"
        >
          Delete
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Label htmlFor="garden-name">Name</Label>
        <Input
          id="garden-name"
          value={garden.name}
          onChange={(e) => setGardenName(e.target.value)}
          className="w-40"
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

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => exportGarden(garden, CATALOG)}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent"
          aria-label="Export PNG"
        >
          Export PNG
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent disabled:opacity-40"
          aria-label="Undo"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent disabled:opacity-40"
          aria-label="Redo"
        >
          Redo ↪
        </button>

        {selectedItemId && (
          <>
            <button
              type="button"
              onClick={() => duplicateItem(selectedItemId)}
              className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent"
              aria-label="Duplicate item"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => rotateItem(selectedItemId)}
              className="rounded border bg-background px-3 py-1 text-sm hover:bg-accent"
              aria-label="Rotate item 90°"
            >
              Rotate ↻
            </button>
            <button
              type="button"
              onClick={() => deleteItem(selectedItemId)}
              className="rounded border bg-background px-3 py-1 text-sm hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Delete item"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </header>
  )
}
