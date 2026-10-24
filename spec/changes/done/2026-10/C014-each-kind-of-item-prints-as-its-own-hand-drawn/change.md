---
id: C014
effort: E02
slice: 4
depends: [C010]
opened: 2026-10-24
closed: 2026-10-24
---

# C014 · Each kind of item prints as its own hand-drawn symbol on the export

## Outcome

On the exported sheet a tree no longer looks like a shrub or a bulb. Each catalog entry names a symbol, and the export draws that symbol in the C007 sketch style, sized to the item, in its catalog colour. A tree is a scalloped canopy with a trunk dot, a shrub a smaller lobed clump, a bed a framed rectangle with soil hatching, and a bulb a small dot cluster. Groundcover is stippled, a herb is a sprig cross, and a vegetable is parallel planting rows. The legend shows the same symbol in miniature instead of a colour square. Tiny items stay visible at small scales.

## Context

Slice 4 of E02. Read the Decisions and the C007 and C010 outcomes. Roughjs is drawn through `ctx.canvas._canvas`, seeds come from `seedHash` of the item id, and all widths are in paper mm. Today `buildItemDrawable` draws every item as a hachured rect or ellipse from `catalogItem.shape`. The editor (`GardenItemShape`) keeps using `shape` and ignores the new field.

## Scope

- Add a required `symbol` to `CatalogItem` as a union type: `'tree' | 'shrub' | 'bed' | 'bulb' | 'groundcover' | 'herb' | 'vegetable'`. Assign it in `src/data/catalog.ts`: bulbs → `bulb`, carrot → `vegetable`, clover, thyme and strawberry → `groundcover`, raised bed → `bed`, basil and lavender → `herb`, rosemary, blueberry and rose → `shrub`, the three trees → `tree`. Keep the catalog diff to the new lines.
- One drawing routine per symbol in `src/export/`, returning roughjs drawables from `(generator, w, h, colour, seed)`. Starting seam: `buildItemDrawable`.
- Minimum drawn size: if an item is smaller than 2.5 mm on paper, draw its symbol at 2.5 mm centred on the item. Record the final value in the outcome.
- Legend entries draw the symbol in miniature (the same routine at swatch size) in place of the colour square.
- Seeds stay derived from the item id. The legend seeds from the catalog id.

## Out of scope

- Item name labels, markers and fonts (slice 5); legend quantities and costs (slice 6).
- Any editor, `GardenItemShape` or `Header.tsx` change; line items (E03); any persist `version` change. `symbol` is catalog data, not saved garden data.

## Acceptance

- Every catalog entry has a `symbol`, and `npm run typecheck` fails if one is missing.
- An export with one item of each symbol shows seven visibly different symbols. Each sits at its item's position and rotation, in its catalog colour.
- At 1:1000 a 0.2 m tulip is drawn at least 2.5 mm across and centred on the item.
- Legend entries show the item's symbol, not a square.
- Two exports of the same garden are byte-identical, and changing one item's id changes only that item's strokes.
- `npm run typecheck`, `npm run test` and `npm run build` pass with no warnings, plus `npm run lint` if ESLint has landed.

## Verification

Unit-test the symbol routines on generator output: each symbol is deterministic for a seed, the symbols differ from one another, and the minimum size holds. Then, on the worker port, use `playwright-cli` (named chromium session) to export one garden with an item of each symbol at about 1:100 and the 100 × 100 m case. Describe both images. Close the session and stop the dev server.
