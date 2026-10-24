---
id: C017
effort: E02
slice: 6
depends: [C016]
opened: 2026-10-24
closed: 2026-10-24
---

# C017 · The legend lists each item's quantity and estimated cost with a grand total

## Outcome

The exported legend doubles as a plant list. Each row shows the marker number, the symbol, the name, how many of that item are placed, and their estimated cost (quantity × the catalog's `estimatedCostEur`). Under the last group, a ruled line and an "Estimated total" row give the sum for the whole garden. A full catalog's legend still fits on the sheet in both orientations.

## Context

Slice 6 of E02. Read the C016 outcome: legend rows are drawn in `drawLegend` (`src/export/renderExportStage.ts`), the content column is 52 mm wide, and rows are 7 mm apart. On a landscape sheet the legend has 158 mm of height (210 − 12 margin − 28 title − 12 margin). With all 15 catalog types it already needs about 159 mm, so adding a total row would overflow the page.

## Scope

- Starting seam: `buildLegendGroups`. Make each entry carry its quantity (placed items with that `catalogId`), and add a pure function that returns per-entry cost and the total.
- Row layout: name on the left; quantity `×N` and cost right-aligned in two columns ending at the content's right edge, all at 9 pt. The total row is bold, under a thin rough rule.
- Money format: `€` followed by the amount with two decimals (`€1,215.00`), built by hand with a comma for thousands. Don't use `Intl` or `toLocaleString`, because they depend on the browser locale and would break byte-identical exports.
- Fit: tighten the legend to 6 mm rows and 5 mm headings, and keep the 4 mm group gap. Don't shrink text below 8 pt.

## Out of scope

- Any cost or quantity display in the editor; editing prices; currency choice.
- North direction (slice 7), symbols, markers, the font, `catalog.ts`, `Header.tsx`.

## Acceptance

- Each legend row shows its marker number, symbol, name, `×N` and the cost for that quantity. A garden with 12 tulips (€0.50 each) and 3 apple trees (€35 each) shows `×12 €6.00`, `×3 €105.00` and a total of `€111.00`.
- Totals use two decimals and a thousands comma, independent of browser locale.
- A landscape and a portrait garden with one item of each of the 15 catalog types show the full legend and total above the bottom margin, with no text overlapping.
- Repeated exports are byte-identical.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed.

## Verification

Unit-test the quantity and cost aggregation, the money formatting (0, 0.4, 1215, 12345.5) and the legend's bottom y for 15 types in both orientations. On the worker port, use playwright-cli (named chromium session) to export the 12-tulip/3-apple garden and a 15-type landscape garden. Report the legend values you see, measure the gap in px between the total row and the bottom margin, and compare the sha256 of two exports. Close the session and stop the dev server.
