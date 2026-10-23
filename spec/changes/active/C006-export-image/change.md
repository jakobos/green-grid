---
id: C006
effort: E01
slice: 5
depends: [C004]
opened: 2026-10-23
---

# C006-export-image · Export garden to a downloadable PNG image

## Outcome

The user clicks an "Export" button in the header and downloads a PNG image of the current garden. The exported image contains: the grid with dimension labels (meters) along top and left edges, all placed items rendered by layer order, a legend listing every placed catalog item with its color swatch and name, the garden title, a north-pointing compass indicator, and overall garden dimensions. The image is print-ready at 150 DPI for up to A3 paper.

## Context

This is the final slice of E01-mvp. The app already has a Konva `Stage` with grid + layered items, a catalog with colors, and multi-garden support. Konva provides `stage.toDataURL()` / `stage.toCanvas()` for rasterisation, but the export image must include surrounding chrome (title, legend, compass, dimension labels) that is not part of the interactive stage.

## Approach

Build a pure-function export pipeline that:

1. Creates an offscreen Konva `Stage` sized to contain the garden plus margin/chrome.
2. Draws the grid, dimension tick labels (meters along top/left), all items (same rendering logic as `GardenItemShape` — shapes + labels, no selection rings), a title bar, a north compass, and a legend panel.
3. Rasterises to PNG via `stage.toDataURL({ pixelRatio })` and triggers a download using a temporary `<a>` element with `download` attribute.

Key parameters:
- `PIXELS_PER_METER = 60` (existing constant).
- Export pixel ratio: `2.5` (gives 150 DPI at 60 px/m ≈ 1 m = 2.36 mm on A3).
- Legend: grouped by layer; each entry shows color swatch + item name. Deduplicated by `catalogId`.
- Compass: simple "N" with arrow, top-right corner of the image.
- Title: garden name, centred above the grid.
- Dimension labels: meter numbers along top and left edges outside the grid border.

File plan:
- `src/export/renderExportStage.ts` — pure function `(garden: Garden, catalog: CatalogItem[]) => Konva.Stage`. Draws everything on an offscreen stage. No React, no DOM dependency beyond Konva.
- `src/export/downloadPng.ts` — `(stage: Konva.Stage, filename: string) => void`. Calls `toDataURL`, creates blob, triggers download.
- `src/export/exportGarden.ts` — orchestrator: calls `renderExportStage` + `downloadPng`, then destroys the stage.
- Wire the "Export PNG" button in `Header.tsx`.
- Tests for `renderExportStage`: verify the offscreen stage is created with correct dimensions, contains expected layers/children, and legend entries match placed items.

## Out of scope

- SVG export (PNG only for MVP).
- Multi-page / tile split for very large gardens.
- Hand-drawn style rendering (deferred to follow-up effort).
- Export settings dialog (format, DPI, paper size).

## Acceptance

- Click "Export PNG" in the header; a PNG file downloads named `<garden-name>.png`.
- The PNG contains: 1 m grid lines, dimension labels along top and left, all placed items with correct shapes/colors/labels/rotations, a legend of placed items grouped by layer, the garden title, and a north compass.
- An empty garden (no items) still exports cleanly: grid, title, compass, empty legend or no legend.
- `npm run typecheck` passes.
- `npm run test` passes (existing + new tests).
- `npm run build` succeeds.

## Verification

`npm run typecheck`, `npm run test`, `npm run build`. Manual: place several items across multiple layers, export, open the PNG, visually confirm all elements present.
