---
id: C013
effort: E02
slice: 3
depends: [C010]
opened: 2026-10-24
closed: 2026-10-24
---

# C013 · Export PDF downloads the same A4 sheet as a one-page PDF

## Outcome

Next to "Export PNG" the header has an "Export PDF" button. It downloads `<garden name>.pdf`: one A4 page in the sheet's orientation, filled edge to edge by the same 300 dpi image that the PNG export produces. Printed at 100 %, the scale bar measures its labelled length on paper.

## Context

Slice 3 of E02. Read the Decisions: one Konva sheet feeds both downloads, and the PDF wraps the raster (no vector text). C010 makes `renderExportStage` return an exact A4 stage (2480 × 3508 or 3508 × 2480 px) and `downloadPng` rasterise it at pixel ratio 1. The C007 outcome says `Header.tsx` loads `@/export/exportGarden` with a dynamic `import()`. Load `jspdf` the same way, so neither lands in the main bundle.

## Scope

- Add `jspdf`. Justification: a direct one-click PDF download; browsers can't produce a PDF file without the print dialog.
- The PDF uses the stage's PNG data URL, placed at 0,0 on a 210 × 297 mm page (297 × 210 in landscape). Read the orientation from the stage size; don't recompute layout.
- Share the stage build and filename logic between PNG and PDF; don't duplicate it. Starting seam: `src/export/exportGarden.ts`.
- The header button sits next to "Export PNG", in the same plain style.
- Keep the PDF reproducible: set jsPDF's creation date to a fixed value (or the garden's `updatedAt`), so exporting twice gives the same bytes.

## Out of scope

- Vector or selectable text, other paper sizes, a print dialog, and PDF metadata beyond the title.
- Any change to the sheet layout (C010) or the sketch style (C007).

## Acceptance

- Clicking "Export PDF" downloads `<garden name>.pdf` (`garden.pdf` if the name is blank), with exactly one page.
- The page is 210 × 297 mm for a portrait sheet and 297 × 210 mm for a landscape sheet (for example 20 × 20 m and 100 × 10 m gardens).
- The embedded image is the PNG export at 2480 × 3508 or 3508 × 2480 px, covering the whole page.
- Two PDF exports of the same garden are byte-identical.
- `jspdf` is not in the main `index` chunk, and the build shows no size warning.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed.

## Verification

Test the shared export path with jspdf mocked: page format, orientation and image placement. Then use the dev server on the worker port and `playwright-cli` (named chromium session) to export a portrait and a landscape garden as PDF. Report the page size and page count (for example with `pdfinfo`) and compare checksums of two exports. Close the session and stop the dev server afterwards.
