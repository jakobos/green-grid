---
id: C004
effort: E01
slice: 4
depends: [C003]
opened: 2026-10-19
---

# C004-garden-switcher · Create, rename, delete, and switch between gardens

## Outcome

A user manages multiple gardens from a switcher strip in the header. Each garden keeps its own items and viewport. Creating a garden switches to it; deleting the last garden is prevented. Undo/redo stacks reset on switch. Existing single-garden localStorage data migrates automatically.

## Context

Needs the persistence model from slice 1 and is placed after slice 3 so switching gardens is useful — there is something to build in each garden.

## Scope

- Refactor store: `gardens: Garden[]`, `activeGardenId`, `viewports: Record<string, Viewport>`
- Actions: `createGarden`, `switchGarden`, `deleteGarden`
- Zustand persist `version: 1` with `migrate` to convert v0 single-garden shape
- Garden switcher UI strip in header: create, select, rename, delete
- Undo stacks reset on switch

## Out of scope

- Garden duplication or reordering
- Export (slice 5)

## Acceptance

- Create a new garden; it becomes active with empty canvas.
- Switch between gardens; each keeps its own items and viewport.
- Rename a garden inline.
- Delete a garden (not the last one); switches to another.
- Refresh page; all gardens and viewports persist.
- Old single-garden localStorage migrates to multi-garden on first load.

## Verification

`npm run typecheck`, `npm run test`, `npm run build`. Manual: create, switch, rename, delete gardens; verify per-garden items and viewport.
