---
id: C010
effort: E02
slice: 2
depends: [C007]
opened: 2026-10-23
---

# C010 · The export is one A4 sheet at 300 dpi with a fit-to-page map and a scale bar

## Outcome

"Export PNG" downloads one A4 sheet at 300 dpi: 2480 × 3508 px in portrait or 3508 × 2480 px in landscape, whatever the garden's size. The map is drawn at a standard plan scale (such as 1:50 or 1:200) chosen to fill the space beside the legend and under the title. A labelled scale bar and the ratio show that scale. A 3 m bed and a 100 m plot both print on one page with the same line weight and text size.

## Context

Slice 2 of E02; read the effort's Decisions (A4 only, standard scales, paper units, one sheet for PNG and PDF). Today `renderExportStage` sizes the stage from the garden at `PIXELS_PER_METER = 60` and `downloadPng` applies `EXPORT_PIXEL_RATIO = 2.5`, so the page size follows the garden. C007 adds the roughjs strokes and the palette; this change keeps that style and changes placement and size. Gardens are whole metres from 1 to 100; the catalog has 15 entries, so the legend fits one column.

## Scope

- Plan the sheet in millimetres and convert to pixels at 300 dpi in exactly one place. The sheet has a fixed margin, a title block on top (name, "W m × H m", scale ratio, compass at the right), a legend column of fixed width on the right, and the map in the remaining area, with room for the meter labels on its top and left.
- Choose the orientation by fitting the garden into both map areas, portrait and landscape, and keeping the one that gives the larger scale. A tie goes to portrait.
- Scale: pick the largest standard ratio that fits, from 1:10, 1:20, 1:25, 1:50, 1:100, 1:200, 1:250, 1:500 and 1:1000. Centre the map in its area. Small gardens scale up and large ones scale down.
- Grid: draw lines every 1 m. If 1 m is under 3 mm on paper, use 5 m, then 10 m. Meter labels sit on grid lines and are at least 8 mm apart.
- Scale bar: a round length of 1, 2, 5, 10, 20 or 50 m, about 40–60 mm on paper, drawn with C007's sketch strokes and labelled in metres, with "1:N" beside it.
- Compute map coordinates in paper pixels (metres × scale). Do not scale a Konva group, because that would scale the stroke widths and the roughjs wobble with the garden. Give stroke widths and font sizes in millimetres or points. No text is smaller than 8 pt.
- Rasterise at pixel ratio 1 on the full-size stage, or use an equivalent that yields exactly 2480 × 3508 px. Remove `EXPORT_PIXEL_RATIO` if nothing uses it any more.
- Keep the layout math (sheet size, orientation, scale, grid step, scale-bar length) as pure functions in `src/export/` and test them there. Starting seam: the size and origin block at the top of `renderExportStage`.

## Out of scope

- PDF (slice 3), item symbols and minimum symbol size (slice 4), font and numbered markers (slice 5), and legend quantities and costs (slice 6). The compass still points up; per-garden north is slice 7.
- PNG `pHYs` DPI metadata. The pixel size makes the sheet 300 dpi at A4. Slice 3's PDF fixes the physical size.
- Legend overflow handling. With 15 catalog entries it cannot overflow. Any change to the editor canvas, the header or the file name.

## Acceptance

- Every export is exactly 2480 × 3508 px (portrait) or 3508 × 2480 px (landscape). Check 1 × 1 m, 20 × 20 m, 100 × 10 m, 10 × 100 m and 100 × 100 m.
- 100 × 10 m exports in landscape and 10 × 100 m in portrait. Each garden picks the orientation with the larger scale.
- The map scale is a ratio from the standard list. At that ratio the garden fits inside the map area without overlapping the title block, legend or margin.
- The scale bar's drawn length equals its labelled metres at the printed ratio, to within 1 px.
- At 1:1000 the grid is drawn every 5 m or 10 m, not every 1 m. No two meter labels are closer than 8 mm.
- Stroke width and text size in pixels are the same for a 3 × 3 m garden and a 100 × 100 m garden.
- Two exports of the same garden are still byte-identical.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed on main by then.

## Verification

Unit-test the layout functions: orientation, scale at ratio boundaries, grid step, scale-bar length. Run the four checks. Then use `npm run dev -- --port <worker port> --strictPort` and `playwright-cli` (named session) to export a small, a square and a long garden with items on several layers. Report each PNG's pixel size, orientation and ratio, describe one image, and compare checksums of two exports of one garden.

## Notes

- Approximate millimetres: 12 mm margin, 60 mm legend column, 28 mm title block. Adjust them if the sheet looks unbalanced and record the final values in the outcome.
- If C007's roughjs parameters (roughness, bowing, hachure gap) were tuned in its 60 px/m units, re-express them in paper units here. Record that in the outcome.
