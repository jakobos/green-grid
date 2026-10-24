---
id: C016
effort: E02
slice: 5
depends: [C014]
opened: 2026-10-24
---

# C016 · The plan shows numbered markers keyed to the legend in a bundled handwritten font

## Outcome

On the exported sheet, item names no longer print on the plan. Every placed item carries a small circled number, and the legend lists the same number next to the item's symbol and name. All text on the sheet (title, dimensions, scale, grid numbers, legend and markers) is set in a bundled handwritten font, so the sheet reads as hand-lettered and works offline.

## Context

Slice 5 of E02. Read the Decisions (markers instead of names, one number per catalog type) and the C014 outcome. Today `drawItem` in `src/export/renderExportStage.ts` adds a `Konva.Text` with the catalog name, wrapped to the item width. In orch's C014 exports (`/tmp/orch-c014-g-small-1.png`, `/tmp/orch-c014-g-big-1.png`), Tulip Bulb, Rose Bush and Silver Birch print one letter per line running 15–20 m down the plan, and the Basil and Rose Bush names overprint their symbols. `FONT` is `'sans-serif'`.

## Scope

- Delete the name text from `drawItem`. Starting seam: `drawItem` in `renderExportStage.ts`.
- Numbering: number the types 1, 2, 3, … in the order `buildLegendGroups` returns them (by layer, then legend order). Share one helper between the plan and the legend.
- Marker: a rough circle 4 mm across with a paper fill and an ink outline, holding the number at 8 pt or larger, upright even when the item is rotated. Centre it on the item when the drawn symbol is at least 8 mm across on both axes. Otherwise put it at the top-right corner of the item's drawn bounds, so it never hides a small symbol.
- Dedupe: skip a marker when a marker with the same number is already within 6 mm (centre to centre), checking items in garden order.
- Legend row: circled number, symbol mini, then name.
- Font: add `@fontsource/patrick-hand` (OFL-1.1). Justification: self-hosted handwritten lettering that works offline. Set `FONT` to it. Before building the stage, load the font with `document.fonts.load` in the export path. `exportGarden` and `exportGardenPdf` may become async; the vitest tests mock the font loading.

## Out of scope

- Quantities, costs and totals (slice 6); the north setting (slice 7); symbol geometry (C014).
- Any change to `Header.tsx` (it already calls the export from an async handler), the editor or `catalog.ts`.

## Acceptance

- No catalog name text is drawn on the map area; names appear only in the legend.
- Each placed item has a marker whose number matches its legend row. Two items of one type get the same number, and nearby duplicates within 6 mm show one marker.
- A 0.2 m tulip at 1:1000 shows its symbol unobscured, with its marker beside it.
- Exported text renders in Patrick Hand, not a fallback, even with the network offline.
- Repeated exports are byte-identical.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed. `@fontsource` stays out of the main `index` chunk.

## Verification

Unit-test the numbering order, the marker placement rule and the dedupe distance. On the worker port, use playwright-cli (named chromium session) to export the 16 × 10 m garden at 1:100 with one item of each symbol and two nearby tulips, then the 100 × 100 m case. Block font requests to other origins during the run. Report the marker and legend numbers you see, and compare the sha256 of two exports. Close the session and stop the dev server.
