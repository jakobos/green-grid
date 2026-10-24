# C016 · The plan shows numbered markers keyed to the legend in a bundled handwritten font — outcome

Item names no longer print on the plan. `buildMarkerNumbers(groups)` in `renderExportStage.ts` numbers catalog types 1, 2, … in `buildLegendGroups` order, and both the plan and the legend use it. `drawCircledNumber` draws a 4 mm rough circle (paper fill, ink outline) with the number at 8 pt.
Plan markers sit on `gardenLayer`, outside the rotated item group, so they stay upright. A marker is centred on an item whose drawn size is at least 8 mm on both axes. On a smaller item the marker sits outside the top-right corner of the drawn box: its centre is offset by radius + 0.5 mm, so it never covers the symbol. Markers with the same number within 6 mm (centre to centre, in garden order) collapse to one.
Legend rows are: circled number, symbol mini, name. The number is centred on the 4 mm swatch, and rows are 7 mm apart. The legend content is 52 mm wide (`LEGEND_W_MM` 60 − `LEGEND_CONTENT_GAP_MM` 8).
`FONT` is `'Patrick Hand'` from `@fontsource/patrick-hand` (OFL-1.1), imported in `exportGarden.ts` so the font files stay in the lazy export chunk. `exportGarden` and `exportGardenPdf` are async and `await document.fonts.load` before building the stage. With requests to other origins blocked, the export made no external requests and repeated exports were byte-identical.

Landed 2026-10-24 with `guild land 2026-10-24-replace-item-names-on-the-6b5e56`: merge commit ef46fb1 of guild/2026-10-24-replace-item-names-on-the-0877ba into master.
