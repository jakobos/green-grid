---
id: E02
status: active
opened: 2026-10-23
---

# E02-hand-drawn-export · Print-ready garden plan in a hand-drawn map style

## Problem

The vision calls the downloaded plan "the product" and asks that it "look like a hand-drawn garden map". E01 deferred this: `src/export/renderExportStage.ts` draws flat Konva circles and rectangles in `sans-serif` on white. The result reads like a screenshot of the editor rather than a plan worth printing. Every item of the same shape looks alike, and the page has no fixed paper size: its pixel size follows the garden, so a large garden prints too small to read and a small one prints oddly cropped.

## Goal

The user exports one A4 sheet as PNG or PDF. The sheet looks hand-drawn: sketchy ink lines on a paper-toned background, hand-lettered title and legend, and a distinct symbol for each kind of item. Numbered markers on the plan are keyed to a legend that lists each placed item type with its quantity, estimated cost and a grand total. The sheet also has a scale bar and a compass. Exporting the same garden twice produces the same image.

## Non-goals

- A hand-drawn look in the editor. The styleguide keeps the editor chrome and canvas plain.
- Paper sizes other than A4, and multi-page tiling. Gardens too large for the page scale down to fit.
- Vector or selectable text in the PDF. The PDF wraps the same 300 dpi raster as the PNG.
- Editing the export layout (moving the legend, choosing fonts or colours).
- Rendering line items (paths, pipes). E03 adds line items and draws them in this style.

## Constraints

- Offline-first: fonts and textures ship with the app; nothing is fetched at export time.
- Deterministic: all randomness in the sketch strokes is seeded from stable inputs (item id, garden id), so tests and repeated exports stay stable.
- The sheet prints legibly on A4 at 300 dpi.
- Each new dependency needs a one-line justification in the change that adds it.

## Approach

One composition, two downloads. `src/export/` builds a single offscreen Konva stage for the whole A4 sheet: map, markers, legend, title block, scale bar and compass. PNG rasterises it at 300 dpi. PDF puts that same raster on an A4 page with `jspdf`. From now on the export renderer deliberately differs from `GardenItemShape`; the copied `drawItem` noted in the C006 outcome becomes the place where the export style lives.

- Sketch strokes: `roughjs` drawn inside `Konva.Shape` `sceneFunc`, so it renders to the same stage and `toDataURL` path. Justification: it gives hand-drawn strokes, fills and hatching for canvas shapes, so we don't maintain our own jitter geometry.
- Sheet: fixed A4, with orientation picked from the garden's aspect ratio. The map scales to fit the space left by the legend and title block. A scale bar shows the resulting scale.
- PDF: `jspdf`, loaded with a dynamic `import()` on first PDF export so the editor bundle doesn't grow. Justification: a direct one-click PDF download; browsers can't produce a PDF file from a page without the print dialog.
- Symbols: each catalog item gains a `symbol` (e.g. `tree`, `shrub`, `bed`, `bulb`, `groundcover`, `herb`) that the export maps to a drawing routine. The editor ignores it.
- Markers: every placed item type gets a number (1, 2, 3, …), ordered by layer and then legend order. Each placed item carries a small circled number on the plan; the legend entry with that number gives name, quantity and cost.
- North direction: each garden stores `northDeg`, one of 0, 45, …, 315, measured clockwise from the top of the plan. Existing gardens migrate to 0 (north up). A plain header control next to the dimensions sets it (N, NE, E, SE, S, SW, W, NW, shown with an arrow), and the editor shows a small north arrow in a corner of the canvas. The plan itself never rotates; only the compass, in the editor and on the export, points to north.

## Decisions

<!-- Append-only: date · decision · why. Workers read this so they do not relitigate. -->
- 2026-10-23 · Hand-drawn style applies to the export only · styleguide "Avoid: hand-drawn aesthetic in the editor chrome"
- 2026-10-23 · Sketch randomness is seeded, never `Math.random` · deterministic tests and repeatable exports
- 2026-10-23 · A4 only; oversized gardens scale down to one page, no tiling · user decision; keeps the plan a single printable sheet
- 2026-10-23 · One Konva sheet feeds both PNG and PDF; PDF via jspdf wrapping the 300 dpi raster · user decision; one layout to maintain, direct download instead of the print dialog
- 2026-10-23 · Numbered markers keyed to the legend, not item names on the plan · user decision; names clutter dense beds
- 2026-10-23 · One marker number per catalog type, not per placed item · a bed of 40 bulbs needs one legend line, not 40
- 2026-10-23 · North direction is a per-garden setting in 8 steps of 45°; the compass rotates, the plan does not · user request; rotating the map would break the grid and meter labels
- 2026-10-23 · North direction lives in E02 because its visible result is the plan's compass; its header control is plain editor chrome · the setting exists for the export
- 2026-10-23 · Changing north, like name and dimensions, is not recorded in undo history · matches existing garden setters
- 2026-10-23 · The map uses the largest standard plan scale that fits (1:10 … 1:1000), not an arbitrary fit factor · the printed "1:N" and the scale bar stay true and readable
- 2026-10-23 · The legend is a fixed-width column on the right in both orientations; the orientation with the larger map scale wins · one layout rule; 15 catalog entries fit one column
- 2026-10-23 · Stroke widths, wobble and text sizes are set in paper units, independent of garden size · a 3 m bed and a 100 m plot print with the same line weight
- 2026-10-24 · Seven symbols: tree, shrub, bed, bulb, groundcover, herb, vegetable; strawberry counts as groundcover, carrot as vegetable · covers the 15 catalog entries without one-off symbols; E04 extends the union when the catalog grows
- 2026-10-24 · Symbols have a minimum drawn size on paper, centred on the item · a 0.2 m bulb at 1:1000 would otherwise be 0.2 mm

## Roadmap

<!-- guild:roadmap — slice text is yours; marks and change ids are generated -->
1. [x] Sketch rendering: seeded roughjs strokes for grid, boundary, items and compass on a paper background — C007
2. [x] A4 sheet: fixed page with orientation from aspect ratio, fit-to-page map, scale bar, PNG at 300 dpi — C010
3. [x] PDF download of the A4 sheet via jspdf — C013
4. [x] Item symbols: per-catalog `symbol` field and a hand-drawn symbol per kind — C014
5. [ ] Lettering and markers: bundled handwritten font, numbered markers on the plan keyed to the legend
6. [ ] Plant list: legend quantities, cost per entry, and a grand total
7. [ ] North direction: per-garden setting in 45° steps, header control, editor north arrow, export compass follows it

## Risks and open questions

- Font licensing: the bundled font must be OFL or similar and self-hosted.
- roughjs inside Konva `sceneFunc` is unproven here; slice 1 confirms it renders under the vitest canvas stub.
- Tiny items on large gardens: at fit-to-A4 scale a 0.2 m bulb in a 100 m garden is about 0.5 mm. Markers keep it findable, but symbols may need a minimum drawn size.
- Marker placement on dense beds will overlap; slice 5 needs a simple rule (e.g. skip a marker when the same number sits within a few mm).
