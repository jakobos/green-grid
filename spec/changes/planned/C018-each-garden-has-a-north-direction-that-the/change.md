---
id: C018
effort: E02
slice: 7
depends: [C017]
opened: 2026-10-24
---

# C018 · Each garden has a north direction that the editor arrow and the export compass follow

## Outcome

A user sets which way north lies for each garden: N, NE, E, SE, S, SW, W or NW, from a compact control in the header. A small arrow in a corner of the editor canvas and the compass on the exported sheet both point that way. The plan itself never rotates. Gardens saved before this change open with north up, and nothing in them is lost.

## Context

Slice 7 of E02. Read the effort's Approach ("North direction") and Decisions (8 steps of 45°; the compass rotates, the plan does not; not recorded in undo history). The store persists as `green-grid-garden` with `version: 1`, and its `migrate` handles version 0. `drawCompass(layer, x, y, gardenId)` in `src/export/renderExportStage.ts` always points up. At a 1280 px viewport the header already wraps (orch finding), so the new control must not add to its height. E03's C015 changes `GardenItem` and adds store actions but stays out of `Header.tsx` and the persist `version`. Keep this diff to `Garden` and the north setter so the two merge cleanly.

## Scope

- Types: `NorthDeg = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315` and a required `northDeg: NorthDeg` on `Garden`. `makeGarden` sets 0.
- Store: `setNorthDeg(deg)`, written like `setGardenName` (touches `updatedAt`, no history snapshot). Persist `version: 2`; `migrate` adds `northDeg: 0` to every garden from version 1, and data from version 0 also ends at version 2 with `northDeg: 0`.
- Header: one native `<select aria-label="North direction">` after Height, with options `↑ N`, `↗ NE`, `→ E`, `↘ SE`, `↓ S`, `↙ SW`, `← W`, `↖ NW` and no extra visible label. Theme tokens only.
- Editor: a small Lucide `ArrowUp` with an `N` in the canvas's top-right corner, as an HTML overlay rotated by `northDeg` (a `style` transform is allowed for dynamic rotation). It ignores pointer events.
- Export: `drawCompass` takes `northDeg` and rotates the arrow about its centre. The `N` stays upright just past the arrow tip in the rotated direction. Keep the compass inside its current 16 × 16 mm box.

## Out of scope

- Rotating the plan, grid or labels; north in undo history; directions other than the 8 steps.
- `catalog.ts`, legend, markers, symbols; E03's line items and properties panel.

## Acceptance

- Choosing E makes the editor arrow and the exported compass point right, and the `N` reads upright. Each of the 8 directions matches its angle on the export.
- The choice is per garden, survives a reload, and isn't undone by Undo.
- Stored data from version 0 and from version 1 loads with `northDeg: 0` and with all gardens, items and viewports unchanged. After a reload the store saves version 2.
- At 1280 × 800 and 1440 × 900 the header is no taller than on main.
- Repeated exports are byte-identical; changing north changes only the compass pixels.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed.

## Verification

Unit-test `migrate` for v0 and v1 input and `setNorthDeg` against undo. RTL-test the header select. On the worker port, use playwright-cli (named chromium session):
- Seed a version-1 localStorage, reload, and report the stored JSON's `version` and `northDeg`.
- Measure the header height at both viewport sizes, on this branch and on the base commit.
- Export N, E and SW. Report the compass bounding box and confirm the diff against the N export stays inside it.

Close the session and stop the dev server.

## Notes

- Persist migration: a reviewer job is due before land (board rule).
- E03 slice 6 (line items) plans its own version bump. Whichever lands second renumbers to the next version and chains its `migrate` step.
