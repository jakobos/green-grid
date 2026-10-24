# C013 · Export PDF downloads the same A4 sheet as a one-page PDF — outcome

The header has an "Export PDF" button next to "Export PNG". `exportGardenPdf` in `src/export/exportGarden.ts` reuses `renderExportStage` and the shared `gardenFilename(garden, ext)` (blank name → `garden`). `src/export/downloadPdf.ts` wraps the stage's PNG at 0,0 on a single A4 page, portrait 210 × 297 mm or landscape 297 × 210 mm, with the orientation read from the stage size.
The output is reproducible: the creation date is the garden's `updatedAt`, and the file ID is 32 hex characters built from four `seedHash` values of `id:updatedAt`. Two exports of the same garden are byte-identical.
`addImage` must pass `'FAST'` compression. Without it jsPDF embeds raw RGB and each PDF is 26 MB; with it a PDF is about 110–230 kB.
`jspdf` is statically imported by `downloadPdf.ts` and stays in the lazy `exportGarden` chunk behind Header's dynamic `import()`. Its optional `html2canvas` and `purify` dependencies build as separate lazy chunks, and the build shows no size warning.
A checkout older than this merge needs `npm ci` to get `jspdf`.

Landed 2026-10-24 with `guild land 2026-10-24-add-an-export-pdf-button-that-a1084f`: merge commit 544ef84 of guild/2026-10-24-add-an-export-pdf-button-that-0a5012 into master.
