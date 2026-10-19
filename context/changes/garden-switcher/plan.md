# Plan: Create, rename, delete, and switch between gardens

## Approach
Replace the single `garden` + `viewport` in the Zustand store with `gardens: Garden[]`, `activeGardenId: string`, and `viewports: Record<string, Viewport>`. Add `createGarden`, `switchGarden`, and `deleteGarden` actions. All existing actions operate on the active garden. Persist with Zustand's `version`/`migrate` to auto-convert the old single-garden localStorage into the new shape. Add a garden-switcher strip to the header for create, select, rename, and delete.

## Data model
- `gardens: Garden[]` — all gardens. The existing `Garden` type already has `id`, `name`, `createdAt`, `updatedAt`.
- `activeGardenId: string` — which garden is shown on the canvas.
- `viewports: Record<string, Viewport>` — per-garden pan/zoom, keyed by garden id.
- `past`/`future` (undo stacks) reset on switch — they are per-editing-session, not per-garden.
- Migration v0→v1: wrap the existing `{ garden, viewport }` into `{ gardens: [garden], activeGardenId: garden.id, viewports: { [garden.id]: viewport } }`.

## Standards to apply
- [ ] Minimal implementation: no factory/abstraction; direct array operations
- [ ] Coding style: match existing store patterns for action shape, `updatedAt` stamping
- [ ] React standard: components use store selectors, no prop-drilling for new state

## Phases
### Phase 1: Multi-garden store and persistence migration
Depends on: none
Refactor `src/store/garden.ts` and `src/types/garden.ts`. Change state shape. Add new actions. Add `version: 1` and `migrate` to the persist config. Update existing tests.
Tests: `src/store/garden.test.ts`

### Phase 2: Garden switcher UI and wiring
Depends on: Phase 1
Add `GardenSwitcher` component to the header. Wire create, switch, rename, delete. Prevent deleting the last garden.
Tests: `src/components/Header.test.tsx`

## Progress
> `- [ ]` pending, `- [x]` done. Append ` — <short-sha>` when a step lands in a commit.

### Phase 1: Multi-garden store and persistence migration
#### Automated
- [ ] 1.1 (isolated) Store holds `gardens` array with active garden accessor; all existing actions work on the active garden
- [ ] 1.2 (isolated) `createGarden` adds a new garden and switches to it
- [ ] 1.3 (isolated) `switchGarden` changes the active garden and resets undo/redo
- [ ] 1.4 (isolated) `deleteGarden` removes a garden (not the last one) and switches to another
- [ ] 1.5 (isolated) Migration converts v0 single-garden localStorage to v1 multi-garden
- [ ] 1.6 (isolated) All existing store tests pass with updated state shape

### Phase 2: Garden switcher UI and wiring
#### Automated
- [ ] 2.1 (isolated) GardenSwitcher renders garden list, create, and delete controls
- [ ] 2.2 (isolated) Full test suite passes
#### Manual
- [ ] 2.3 (agent-runnable) Create, switch, rename, delete gardens in the browser; each garden keeps its own items and viewport
