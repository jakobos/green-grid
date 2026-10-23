---
id: C007
effort: E02
slice: 1
depends: []
opened: 2026-10-23
---

# C007 · The export draws the plan in seeded hand-drawn strokes on a paper background

## Outcome

The exported PNG looks sketched rather than computer-drawn. It has a warm paper-toned background, and the grid, garden boundary, items and compass use wobbly ink strokes. Items are filled with loose hachure in their catalog colour instead of flat fills. Exporting the same garden twice gives the same image.

## Context

This is the first slice of E02. Read the effort's Decisions before starting: export only, seeded randomness, one Konva sheet. Today `src/export/renderExportStage.ts` draws plain `Konva.Line`, `Rect`, `Circle` and `Arrow` nodes on white. The C006 outcome notes that its `drawItem` copies `GardenItemShape`; from now on it deliberately diverges.

## Scope

- Add `roughjs`. Justification: hand-drawn strokes, fills and hachure for canvas shapes, without our own jitter geometry.
- Draw roughjs output inside `Konva.Shape` `sceneFunc`, so it stays on the existing offscreen stage and `toDataURL` path. `rough.generator()` is pure and needs no canvas, which keeps the geometry testable under jsdom.
- Derive a numeric seed for each shape from stable strings (garden id for the grid and frame, item id for each item). Never use `Math.random`.
- Use a paper background colour and an ink palette, defined as named constants in one export module.
- Grid lines are lighter and thinner than the boundary; a 1 m grid must not overpower the items.
- Keep the existing layout, legend, title text, dimension labels and item name labels unchanged.

## Out of scope

- A4 sheet, fit-to-page, scale bar (slice 2); PDF (slice 3).
- Per-item symbols (slice 4); fonts and numbered markers (slice 5); legend quantities and costs (slice 6).
- Any change to the editor canvas or `GardenItemShape`.

## Acceptance

- The exported PNG has a paper-toned background and sketchy strokes for the grid, boundary, every item and the compass.
- Area items show hachure fills in their catalog colour, at their position and rotation.
- Generating the export geometry twice for the same garden gives identical output; changing one item's id changes only that item's strokes.
- No `Math.random` call is reachable from `src/export/`.
- `npm run test` and `npm run build` pass.

## Verification

Run `npm run test` and `npm run build`. Start the dev server and use `playwright-cli` to place items on all five layers, export, and open the PNG. Attach or describe the image. Export a second time and confirm the two files are byte-identical.

## Notes

- Seeded geometry is the testable seam. Assert on generator output, not on canvas pixels.
- If roughjs can't draw through Konva's context wrapper, use the native context Konva exposes inside `sceneFunc`, and record that in the outcome.
