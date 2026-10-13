# Plan: Item catalog and drag-and-drop placement

## Approach
Add a static catalog of ~15 built-in items across all five layers. Show them in a collapsible left sidebar grouped by layer. The user drags an item from the sidebar and drops it onto the Konva canvas, where it snaps to the 1 m grid. Items render as colored shapes (rectangles or circles) with labels, layered bottom to top. Placed items persist to localStorage through the existing Zustand store.

## Assumptions
- ~15 catalog items across the five layers. Exact items chosen for reasonable garden coverage, not exhaustive.
- Item shapes: rectangles for most items, circles for trees (representing canopy). Colors per layer for visual grouping.
- Drag uses HTML5 drag events from the sidebar; the canvas drop handler converts screen coordinates to grid-snapped garden coordinates.
- Grid snapping: item position rounds to the nearest meter on drop.
- No select, move, rotate, resize, or delete in this slice — that is slice 3 (item manipulation).
- No undo/redo in this slice — that is slice 3.
- Items render at their default size. Resizing deferred to slice 3.
- `rotationDeg` field stored as 0; rotation UI deferred to slice 3.
- The sidebar is collapsible to preserve canvas space per the "minimal UI, maximum canvas" principle.
- Layer names and ordering follow the vision: 1 Underground, 2 Ground level, 3 Ground items, 4 Low plants, 5 Trees.
- Estimated cost is stored in the catalog as EUR — displayed later (not in this slice).

## Data model

Expand `GardenItem` and add `CatalogItem`. Current `GardenItem` is `{ id: string }` with an empty items array — additive, no migration needed.

```typescript
type Layer = 1 | 2 | 3 | 4 | 5

type CatalogItem = {
  catalogId: string          // kebab-case, e.g. "small-tree"
  name: string
  description: string
  layer: Layer
  defaultWidthMeters: number
  defaultHeightMeters: number
  shape: 'rect' | 'circle'
  color: string              // hex, per-layer grouping
  estimatedCostEur: number
}

type GardenItem = {
  id: string                 // crypto.randomUUID()
  catalogId: string          // references CatalogItem.catalogId
  xMeters: number            // top-left, snapped to grid
  yMeters: number
  widthMeters: number
  heightMeters: number
  rotationDeg: number        // 0 for now
}
```

The `items: GardenItem[]` field on `Garden` gains richer objects. Old persisted data has `items: []`, which is compatible — no migration needed.

## Standards to apply
- [ ] **Stack**: react-konva for canvas rendering, Zustand for state, shadcn/ui for sidebar controls
- [ ] **React**: one component per file, typed props with `type`, PascalCase filenames
- [ ] **TypeScript**: strict mode, union types for Layer, explicit return types on exports
- [ ] **Theme**: sidebar uses shadcn/ui components and Tailwind tokens, no hardcoded colors in UI chrome
- [ ] **Testing**: Vitest + RTL, co-located test files, behavior-focused
- [ ] **Minimal implementation**: no undo/redo, no select/move/rotate/delete — those belong to slice 3

## Priors & gotchas
No lessons recorded yet.

## Phases

### Phase 1: Catalog, store, and sidebar palette
Depends on: none

Define `CatalogItem` and expand `GardenItem` types. Create the static catalog (~15 items). Add `addItem` and `removeItem` actions to the Zustand store. Build a collapsible left sidebar component that groups catalog items by layer and supports HTML5 drag-start on each item.

Starting seam: `src/types/garden.ts`, `src/data/catalog.ts`, `src/store/garden.ts`, `src/components/Sidebar.tsx`.

Tests: `src/store/garden.test.ts`, `src/components/Sidebar.test.tsx`

### Phase 2: Canvas drop, item rendering, and layer ordering
Depends on: 1

Handle HTML5 drop on the canvas container, converting screen coordinates to garden coordinates and snapping to the 1 m grid. Render placed items on the Konva stage as colored shapes (rect or circle per catalog entry) with name labels. Use five Konva `Layer` components rendered bottom to top so items appear in layer order. Verify items persist across page refresh.

Starting seam: `src/components/Canvas.tsx`, `src/components/GardenItemShape.tsx`.

Tests: `src/components/Canvas.test.tsx`, `src/components/GardenItemShape.test.tsx`

## Progress
> `- [ ]` pending, `- [x]` done. Append ` — <short-sha>` when a step lands in a commit.

### Phase 1: Catalog, store, and sidebar palette
#### Automated
- [x] 1.1 (isolated) CatalogItem and expanded GardenItem types compile, catalog has items for all 5 layers — 96aa187
- [x] 1.2 (isolated) Store addItem creates a GardenItem with UUID and snapped position; removeItem removes by id — 96aa187
- [x] 1.3 (isolated) Sidebar renders catalog items grouped by layer with drag handles — 96aa187
- [x] 1.4 (isolated) `vitest run` passes — 96aa187
#### Manual
- [x] 1.5 (agent-runnable) Dev server shows sidebar on the left with items grouped under layer headings; sidebar collapses — 96aa187

### Phase 2: Canvas drop, item rendering, and layer ordering
#### Automated
- [ ] 2.1 (isolated) GardenItemShape renders the correct shape and label for a catalog item
- [ ] 2.2 (isolated) Drop handler converts screen coords to grid-snapped garden coords
- [ ] 2.3 (isolated) `vitest run` passes
#### Manual
- [ ] 2.4 (agent-runnable) Drag item from sidebar onto canvas; colored shape appears at snapped position
- [ ] 2.5 (agent-runnable) Items from different layers render in correct order (underground below trees)
- [ ] 2.6 (agent-runnable) Refresh page; placed items still visible on canvas
