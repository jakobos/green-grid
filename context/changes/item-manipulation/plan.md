# Plan: Select, move, rotate, and delete items with undo and redo

## Approach
Add item selection, repositioning, rotation, and deletion to the canvas. The user clicks an item to select it (highlighted border), drags to reposition with grid snapping, rotates in 90° increments, and deletes with the Delete key or a toolbar button. Undo/redo uses full state snapshots stored in Zustand — Ctrl+Z / Ctrl+Shift+Z and header buttons. Undo covers all canvas mutations: placement from the item catalog and placement change (`item-placement`), plus the move/rotate/delete actions added here.

## Assumptions
- Single selection only. Click an item to select it; click empty canvas to deselect. No multi-select.
- Rotation snaps to 90° increments. A rotate button or `R` key rotates the selected item clockwise.
- Move snaps to 1 m grid (same as placement).
- Delete via Delete/Backspace key and a visible toolbar button when an item is selected.
- Selection state is ephemeral — not persisted to localStorage. On page reload, nothing is selected.
- Undo/redo history is ephemeral — not persisted. Fresh history on page reload.
- Undo history capped at a reasonable depth (e.g. 50 snapshots). Small garden state makes this cheap.
- Selected item shows a visual indicator: highlighted border or Konva Transformer handles.
- No resize in this slice. The vision says "resized where it makes sense" — deferred until the need is clear.
- Undo/redo applies to the `items` array only, not to garden name/dimensions/viewport.

## Standards to apply
- [ ] **Stack**: Zustand for state + undo history, react-konva for canvas interaction
- [ ] **React**: one component per file, typed props
- [ ] **TypeScript**: strict mode, explicit return types on exports
- [ ] **Testing**: Vitest + RTL, co-located, behavior-focused
- [ ] **Minimal implementation**: no multi-select, no resize, no context menus

## Priors & gotchas
No lessons recorded yet.

## Phases

### Phase 1: Selection and move
Depends on: none

Add `selectedItemId` to the store (ephemeral, not persisted). Click a canvas item to select it — show a highlighted border. Click empty canvas to deselect. Drag a selected item to reposition it with 1 m grid snapping. Update the item's `xMeters`/`yMeters` in the store on drag end.

Starting seam: `src/store/garden.ts`, `src/components/GardenItemShape.tsx`, `src/components/Canvas.tsx`.

Tests: `src/store/garden.test.ts`, `src/components/GardenItemShape.test.tsx`

### Phase 2: Rotate and delete
Depends on: 1

Add a rotate action (`R` key or toolbar button) that increments `rotationDeg` by 90° on the selected item. Add a delete action (Delete/Backspace key and a toolbar button) that removes the selected item and clears selection. The toolbar button appears in the header when an item is selected.

Starting seam: `src/store/garden.ts`, `src/components/Header.tsx`.

Tests: `src/store/garden.test.ts`, `src/components/Header.test.tsx`

### Phase 3: Undo and redo
Depends on: 2

Implement undo/redo as full snapshots of the `items` array. Push a snapshot before each mutating action (addItem, removeItem, moveItem, rotateItem). Ctrl+Z undoes, Ctrl+Shift+Z redoes. Add undo/redo buttons in the header. Cap history at 50 entries.

Starting seam: `src/store/garden.ts`, `src/components/Header.tsx`.

Tests: `src/store/garden.test.ts`

## Progress
> `- [ ]` pending, `- [x]` done. Append ` — <short-sha>` when a step lands in a commit.

### Phase 1: Selection and move
#### Automated
- [x] 1.1 (isolated) Store tracks selectedItemId; selectItem and clearSelection work — b5e9f0f
- [x] 1.2 (isolated) Moving an item updates xMeters/yMeters snapped to grid — b5e9f0f
- [x] 1.3 (isolated) `vitest run` passes — b5e9f0f
#### Manual
- [ ] 1.4 (agent-runnable) Click item on canvas shows selection highlight; click canvas deselects
- [ ] 1.5 (agent-runnable) Drag selected item repositions it; snaps to 1 m grid
### Phase 2: Rotate and delete
#### Automated
- [ ] 2.1 (isolated) rotateItem increments rotationDeg by 90; wraps at 360
- [ ] 2.2 (isolated) deleteItem removes item and clears selection
- [ ] 2.3 (isolated) `vitest run` passes
#### Manual
- [ ] 2.4 (agent-runnable) Press R with item selected; item rotates 90° on canvas
- [ ] 2.5 (agent-runnable) Press Delete; item removed from canvas. Toolbar delete button also works

### Phase 3: Undo and redo
#### Automated
- [ ] 3.1 (isolated) Undo after addItem restores previous items array
- [ ] 3.2 (isolated) Redo after undo restores the undone state
- [ ] 3.3 (isolated) History caps at 50 entries; oldest dropped
- [ ] 3.4 (isolated) `vitest run` passes
#### Manual
- [ ] 3.5 (agent-runnable) Ctrl+Z undoes last action; Ctrl+Shift+Z redoes it
- [ ] 3.6 (agent-runnable) Undo/redo header buttons enabled/disabled correctly
