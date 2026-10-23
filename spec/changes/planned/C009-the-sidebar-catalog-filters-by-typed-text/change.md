---
id: C009
effort: E03
slice: 2
depends: []
opened: 2026-10-23
---

# C009 · The sidebar catalog filters by typed text

## Outcome

A user can type into a search box at the top of the catalog sidebar and see only the items whose name or description matches, still grouped under their layer headings. Clearing the box brings the full catalog back. Typing in the box never rotates, deletes or undoes anything on the canvas.

## Context

Second slice of E03; see the effort's Approach (filter input that matches name and description and keeps the per-layer grouping) and Constraints ("Keyboard shortcuts must not fire while typing in an input"). `src/components/Sidebar.tsx` renders `CATALOG` grouped by `LayerSection`, each with its own collapse state. The global `keydown` listener in `src/components/Canvas.tsx` handles Ctrl+Z / Ctrl+Shift+Z, `r` and Delete/Backspace with no check of the event target. Today, with an item selected, pressing Backspace or `r` in the header's garden name field deletes or rotates the item; a search box would make that worse.

## Scope

- Start in `Sidebar.tsx`: add the search input (reuse `src/components/ui/input.tsx`) above the layer list, shown only when the sidebar is expanded, with an accessible label.
- Matching: case-insensitive substring on `name` and `description`, query trimmed. Layers with no matches are hidden. When nothing matches, show a short "no items match" message.
- While a query is active, a layer's matches are visible even if the user collapsed that layer.
- Escape in the search box clears it.
- In `Canvas.tsx`, make the keydown handler ignore events whose target is an `input`, `textarea`, `select` or content-editable element. Keep that check in one small named helper.
- Dragging a filtered item onto the canvas still places it.

## Out of scope

- Fuzzy matching, ranking, highlighting, or search over layer names.
- Persisting the query across reloads.
- Changing `src/data/catalog.ts`, catalog entries or the drop handler's snapping (C008 owns that hunk in `Canvas.tsx`).

## Acceptance

- Typing "rose" (any case) shows only items with "rose" in name or description, under their layer headings; other layers are hidden.
- A query matching only a description shows that item.
- A query with no matches shows the empty message and no items; clearing the box or pressing Escape restores all items.
- With an item selected, typing `r` or Backspace in the search box or the garden name field does not rotate or delete it, and Ctrl+Z there does not undo the canvas.
- A filtered item can still be dragged onto the canvas and is placed.
- `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass.

## Verification

Add React Testing Library tests in `Sidebar.test.tsx` for filtering, empty state and clearing, and a `Canvas.test.tsx` test that keydown from an input is ignored. Then `npm run dev -- --port 5193 --strictPort` and use `playwright-cli -s=e03w2`: search, drag a filtered item onto the canvas, select it, type `r` and Backspace into the search box, and confirm the item is unchanged. Report what you saw.

## Notes

- Use real catalog names from `src/data/catalog.ts` in tests rather than a mocked catalog, so the tests show what the user sees.
