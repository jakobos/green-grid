# C017 · The legend lists each item's quantity and estimated cost with a grand total — outcome

The export legend is now a plant list. `buildLegendGroups` returns `LegendGroup { layer, entries: LegendEntry[] }`, where `LegendEntry = { catalogItem, qty }` and `qty` counts the placed items of that catalog type. `computeLegendTotal(groups)` sums `qty × estimatedCostEur`. `formatEuro` builds `€1,215.00` by hand from `Math.round(amount * 100)`, with no `Intl`, so output doesn't depend on the browser locale.
Rows are: circled number, symbol, name, then right-aligned `×N` (7 mm) and cost (11 mm) columns ending at the legend's right edge. A thin rough rule and a bold "Estimated total" row follow the last group. Rows are 6 mm apart and headings 5 mm, with a 4 mm gap between groups.
With all 15 catalog types, the landscape legend ends 10.6 mm above the bottom margin; the portrait legend has far more room. Anything added to the legend later (for example E03's item labels) must re-measure the landscape case.
The branch carried a `sharp` dependency commit and its revert (an install that kept running after its eval cell timed out). The net change touches only `renderExportStage.ts` and its test.

Landed 2026-10-24 with `guild land 2026-10-24-turn-the-export-legend-into-a-7afe81`: merge commit 67f06ab of guild/2026-10-24-turn-the-export-legend-into-a-7afe81 into master.
