# C014 · Each kind of item prints as its own hand-drawn symbol on the export — outcome

`CatalogItem` has a required `symbol: ItemSymbol` (`tree | shrub | bed | bulb | groundcover | herb | vegetable`), set on all 15 entries in `src/data/catalog.ts`. Test fixtures that build catalog items need it too. `src/export/symbolDrawables.ts` has one routine per symbol behind `drawSymbol(gen, symbol, w, h, colour, seed)`. Each routine returns roughjs drawables that fill the w × h box (a unit test checks ≥ 95% coverage). `buildItemDrawable` is gone; `drawItem` and `drawLegend` call `drawSymbol` directly.
Minimum drawn size is `MIN_SYMBOL_PX` = 2.5 mm (≈ 29.5 px at 300 dpi), applied per axis and centred on the item. A 0.2 m tulip at 1:1000 measured 32 px of ink.
Item seeds come from `seedHash(item.id)` and legend seeds from `seedHash(catalogId)`. Repeated exports are byte-identical, and changing one item's id changes only that item's pixels.
Groundcover is cross-hatched, not stippled: roughjs `fillStyle: 'dots'` calls `Math.random()` and ignores `seed`, so never use it in the export.
Known gap handed to slice 5: item names still print on the plan wrapped to the item width. Small items print one letter per line running far down the plan, and names overprint their symbols.

Landed 2026-10-24 with `guild land 2026-10-24-make-each-catalog-kind-print-as-efde5a`: merge commit 2581586 of guild/2026-10-24-make-each-catalog-kind-print-as-1eb4dc into master.
