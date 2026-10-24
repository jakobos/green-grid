---
id: C012
effort: E03
slice: 4
depends: []
opened: 2026-10-24
---

# C012 · Area items can be resized with handles, snapped to 0.1 m

## Outcome

A user selects a placed item and drags handles on its selection box to make it wider, taller or smaller. The new width and height snap to 0.1 m, never below 0.1 m, so a 0.2 m bulb can become 0.3 m. The edge opposite the dragged handle stays where it was. One undo restores the previous size and position, and the new size survives a reload.

## Context

Fourth slice of E03; read the effort's Approach (Konva `Transformer`, rotation disabled, size snapped to 0.1 m) and Decisions (size step 0.1 m, separate from the 0.5 m position step). `src/lib/snap.ts` has `POSITION_SNAP_METERS` and `snapPosition` (C008). `GardenItemShape.tsx` draws each item as a `Group` centred on the item with `offsetX/offsetY` and `rotation`, and `xMeters/yMeters` are the unrotated top-left. `widthMeters`/`heightMeters` already exist on `GardenItem`: no type change, no persist `version` bump.

## Scope

- Start in `src/lib/snap.ts`: add `SIZE_SNAP_METERS = 0.1` and `snapSize(meters)`: nearest 0.1, minimum 0.1, exact decimal values (no `0.30000000000000004`).
- Store: a `resizeItem(id, { xMeters, yMeters, widthMeters, heightMeters })` action that pushes one history snapshot.
- A Konva `Transformer` attached to the selected item's group, inside an existing layer (the stage already has six; add no `Layer`). Rotation off. Rect items resize width and height independently; circle items keep their aspect ratio.
- On transform end, convert the node's scale into a snapped size, reset scale to 1, and write size plus position once. Keep the opposite edge fixed, also for items rotated 90°, 180° or 270°. Positions after a resize are rounded to 0.1 m, not snapped to 0.5 m; the next move snaps them back.

## Out of scope

- Typed width and height, label and notes (slice 5, properties panel).
- Line items and vertex handles (slice 6).
- Any edit to `src/export/`, `src/data/catalog.ts`, `Header.tsx` or the persist `version`.
- Clamping sizes to the garden bounds.

## Acceptance

- Dragging a rect's right handle to about +0.53 m stores a width 0.5 m larger; height and x unchanged.
- Dragging its left handle keeps the right edge where it was and stores the new x.
- A circle resized from a corner keeps width equal to height.
- Shrinking any item past its minimum stops at 0.1 m.
- On an item rotated 90°, the visual edge opposite the dragged handle stays put.
- One undo restores the size and position before the resize; redo reapplies; a reload keeps the new size.
- Handles appear only on the selected item; drag-to-move, `r`, Delete and Ctrl+D still work.
- `npm run typecheck`, `npm run test` and `npm run build` pass.

## Verification

Unit-test `snapSize` and the scale-to-size/position conversion (including 90°) as pure functions. Run test and build once each at the end; the host is one CPU. Then `npm run dev -- --port 5192 --strictPort` and `playwright-cli -s=e03w open --browser=chromium …`: resize a rect from the right and left handles, a circle from a corner, a rotated rect; undo, redo, reload. Report the stored values. Close the playwright session and stop the dev server before finish.

## Notes

- Keep the transform maths in a pure helper beside `GardenItemShape.tsx`, so it is testable under jsdom without Konva pointer events.
