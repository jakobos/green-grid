---
id: C015
effort: E03
slice: 5
depends: [C012]
opened: 2026-10-24
---

# C015 · The selected item has a properties panel for label, width, height and notes

## Outcome

When a user selects a placed item, a compact panel shows its catalog name and lets them type a label (e.g. "Gertrude Jekyll"), an exact width and height in meters, and free-text notes. Typed sizes snap to 0.1 m like the resize handles; edits undo and redo, and survive a reload. Typing in the panel never triggers editor shortcuts.

## Context

Fifth slice of E03; read the effort's Approach ("Item properties") and Decisions (size step 0.1 m; customization per placed item, never new catalog entries). C012 adds `snapSize`/`SIZE_SNAP_METERS` in `src/lib/snap.ts` and a `resizeItem` store action that pushes one history snapshot; reuse both. `Canvas.tsx` already has `isTypingTarget` guarding shortcuts. `App.tsx` lays out Header, Sidebar and Canvas.

## Scope

- Start in `src/types/garden.ts`: add optional `label?: string` and `notes?: string` to `GardenItem`. Optional fields keep old saved gardens valid: no persist `version` bump, no migration (see Notes).
- Store: an `updateItemProperties(id, { label?, notes? })` action, one history snapshot per committed edit. Empty or whitespace-only label/notes are stored as absent.
- A `PropertiesPanel` component (shadcn/ui inputs, Tailwind theme tokens), visible only while an item is selected, placed so it does not cover the canvas centre. Shows the catalog name; label, width, height and notes fields.
- Commit on blur and on Enter (not per keystroke), so one edit is one undo step. Width/height go through `snapSize`; for circle items width and height stay equal. A typed size keeps the item's top-left (`xMeters/yMeters`) fixed.
- The canvas shows the label instead of the catalog name on the item when a label is set.

## Out of scope

- Legend and marker changes in `src/export/` (the labelled legend entry follows E02 slices 5 and 6; planned as its own E03 slice).
- Line items (slice 6).
- Any edit to `src/data/catalog.ts`, `Header.tsx` or the persist `version`.

## Acceptance

- Selecting an item shows the panel with its catalog name and current width/height; clearing the selection hides it.
- Typing label "Gertrude Jekyll" and pressing Enter shows it on the item; reload keeps it.
- Typing width 1.23 stores 1.2; typing 0 or a negative stores 0.1; a non-number restores the previous value. Top-left stays put.
- On a circle, typing width 1.5 sets height 1.5 too.
- Notes accept multi-line text and survive reload.
- One undo reverts one committed field edit; redo reapplies.
- While focus is in any panel field, `r`, Delete, Backspace and Ctrl+D do not act on the item.
- Resizing with handles updates the panel's width/height.
- `npm run typecheck`, `npm run test` and `npm run build` pass.

## Verification

Unit-test the store action and the size-commit parsing as pure functions; RTL test for the panel's shortcut guard and commit-on-Enter. Run test and build once each at the end; the host is one CPU. Then `npm run dev -- --port 5192 --strictPort` and `playwright-cli -s=e03w open --browser=chromium …`: walk every Acceptance line, report stored values from localStorage. Close the playwright session and stop the dev server before finish.

## Notes

- Constraint "data model changes bump the persist version" is met without a bump here: both fields are optional and absent in old data, so the stored shape stays valid as-is. This keeps the version bump out of land-time overlap with E02 slice 7 and E03 slice 6. Decided by coord-e03 2026-10-24.
- Data model change: a reviewer job is due before land (board rule).
