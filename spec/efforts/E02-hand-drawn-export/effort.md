---
id: E02
status: proposed
opened: 2026-10-23
---

# E02-hand-drawn-export · Print-ready garden plan in a hand-drawn map style

## Problem

The vision calls the downloaded plan "the product" and asks that it "look like a hand-drawn garden map". E01 deferred this: `src/export/renderExportStage.ts` draws flat Konva circles and rectangles in `sans-serif` on white. The result reads like a screenshot of the editor rather than a plan worth printing. Every item of the same shape looks alike, the plan has no names on it, and the page has no fixed paper size, so a large garden prints too small to read.

## Goal

The Export button downloads a plan that looks hand-drawn and fits on a chosen paper size. The plan has sketchy ink lines on a paper-toned background, a hand-lettered title and labels, a distinct symbol for each kind of item, a scale bar and compass, and a legend listing each placed plant with its quantity and estimated cost. Exporting the same garden twice produces the same image.

## Non-goals

- A hand-drawn look in the editor. The styleguide keeps the editor chrome and canvas plain.
- Multi-page tiling. Gardens too large for the page scale down to fit.
- Editing the export layout (moving the legend, choosing fonts or colours).
- Rendering line items (paths, pipes). E03 adds line items and draws them in this style when it does.

## Constraints

- Offline-first: fonts and textures ship with the app; nothing is fetched at export time.
- Deterministic: all randomness in the sketch strokes is seeded from stable inputs (item id, garden id), so tests and repeated exports stay stable.
- Output prints legibly at 300 dpi on the chosen paper.
- Each new dependency needs a one-line justification in the change that adds it.

## Approach

The export keeps its own renderer in `src/export/` and builds an offscreen Konva stage, as today. From now on it deliberately differs from `GardenItemShape`; the copied `drawItem` noted in the C006 outcome becomes the place where the export style lives.

- Sketch strokes: `roughjs` drawn inside `Konva.Shape` `sceneFunc`, so it renders to the same stage and `toDataURL` path. Justification: it gives hand-drawn strokes, fills and hatching for canvas shapes, so we don't maintain our own jitter geometry.
- Symbols: each catalog item gains a `symbol` (e.g. `tree`, `shrub`, `bed`, `bulb`, `groundcover`, `herb`) that the export maps to a drawing routine. The editor ignores it.
- Page: the export chooses a paper size and orientation, fits the garden, legend and title block inside it, and draws a scale bar.
- Legend: grouped by layer as today. Each entry adds a count and a cost subtotal from `estimatedCostEur`, with a grand total at the bottom.

## Decisions

<!-- Append-only: date · decision · why. Workers read this so they do not relitigate. -->
- 2026-10-23 · Hand-drawn style applies to the export only · styleguide "Avoid: hand-drawn aesthetic in the editor chrome"
- 2026-10-23 · Sketch randomness is seeded, never `Math.random` · deterministic tests and repeatable exports
- 2026-10-23 · Oversized gardens scale down to one page, no tiling · keeps the plan a single printable sheet

## Roadmap

<!-- guild:roadmap — slice text is yours; marks and change ids are generated -->
1. [ ] Sketch rendering: seeded roughjs strokes for grid, boundary, items and compass on a paper background
2. [ ] Item symbols: per-catalog `symbol` field and a hand-drawn symbol per kind
3. [ ] Lettering: bundled handwritten font for title, dimension labels, legend and on-plan item labels
4. [ ] Page fit: paper size and orientation, fit-to-page scaling, scale bar
5. [ ] Plant list: legend counts, cost subtotals per entry, and a grand total

## Risks and open questions

- Paper sizes: A4 only, or A4 and A3? Is PNG enough, or is PDF needed? PDF would add a dependency such as `jspdf`.
- On-plan labels: names next to each item, or numbered markers keyed to the legend? Names clutter dense beds; numbers need a lookup.
- Font licensing: the bundled font must be OFL or similar and self-hosted.
- roughjs inside Konva `sceneFunc` is unproven here; slice 1 confirms it renders under the vitest canvas stub.
