---
id: C008
effort: E03
slice: 1
depends: []
opened: 2026-10-23
closed: 2026-10-23
---

# C008 · Items snap to a 0.5 m grid when dropped and moved

## Outcome

A user can place and move items in half-meter steps instead of whole meters. Dropping an item from the catalog and dragging a placed item both land its top-left corner on the nearest 0.5 m position. Undo and redo restore half-meter positions exactly, and they survive a reload.

## Context

First slice of E03; read the effort's Decisions (0.5 m position step replaces 1 m). Today positions are rounded to whole meters in two places: `handleDrop` in `src/components/Canvas.tsx` (`Math.round(gardenPixelX / PIXELS_PER_METER)`) and `handleDragEnd` in `src/components/GardenItemShape.tsx`. The stored `xMeters`/`yMeters` are plain numbers, so existing gardens with whole-meter positions stay valid: no persist `version` bump, no migration.

## Scope

- Add a shared `snapPosition(meters: number): number` and `POSITION_SNAP_METERS = 0.5` in `src/lib/snap.ts`; start there, then replace both `Math.round` call sites with it.
- Results must be exact multiples of 0.5 (no `0.30000000000000004`-style drift) and must not produce `-0`.
- Update the existing whole-meter snap tests in `Canvas.test.tsx` to the new step instead of keeping them alongside.

## Out of scope

- `snapSize` and the 0.1 m size step (slice 4, resize). Do not add it now.
- Half-meter lines in the editor grid or the export grid; the 1 m grid stays.
- Keyboard nudging, duplicate offset (slice 3), line vertices (slice 6).
- Any change to `src/export/`, `src/data/catalog.ts`, the header or the persist `version`.

## Acceptance

- Dropping a catalog item stores `xMeters`/`yMeters` as the nearest multiple of 0.5 to the drop point (e.g. 2.3 → 2.5, 2.2 → 2, 2.25 → 2.5).
- Dragging a placed item stores its new top-left at the nearest multiple of 0.5, including for rotated items.
- Undo after a half-meter move restores the previous position; redo reapplies it.
- A half-meter position survives a page reload.
- `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass.

## Verification

Unit-test `snapPosition` on boundaries (x.25, x.75, negatives, 0) and the drop handler's stored coordinates. Then `npm run dev -- --port 5192 --strictPort` and use `playwright-cli -s=e03w`: drop an item, drag it by about a quarter meter and by about three quarters, read the stored positions from localStorage, undo, reload. Report the positions you observed.

## Notes

- Keep `snapPosition` pure and side-effect free; slices 3 and 6 will call it.
