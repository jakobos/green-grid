---
id: C011
effort: E03
slice: 3
depends: [C008]
opened: 2026-10-23
---

# C011 · The selected item can be duplicated with Ctrl+D or a button

## Outcome

A user can duplicate the selected item by pressing Ctrl+D or clicking a Duplicate button in the header. The copy appears one snap step (0.5 m) right and down from the original, with the same type, size and rotation, and it becomes the selection, so pressing Ctrl+D repeatedly lays out a diagonal row. One undo removes the copy. Ctrl+Shift+Z redoes, as the header's Redo button already does.

## Context

Third slice of E03; see the effort's Approach ("Duplicate: Ctrl+D and a button. The copy is offset by one snap step and becomes the selection"). C008 added `POSITION_SNAP_METERS` and `snapPosition` in `src/lib/snap.ts`; C009 made the `Canvas.tsx` keydown handler ignore events from inputs. Mutations go through `pushHistory` in `src/store/garden.ts`, as `addItem` does. Bug found while verifying C008: the keydown handler tests `e.key === 'z'`, but with Shift held the key is `'Z'`, so Ctrl+Shift+Z never redoes.

## Scope

- Start in `src/store/garden.ts`: add a `duplicateItem(id)` action that copies every field of the item except `id` (so later fields such as label and notes copy too), offsets x and y by `POSITION_SNAP_METERS`, pushes one history snapshot, and selects the copy.
- `Canvas.tsx` keydown: Ctrl+D duplicates the selection and calls `preventDefault` (the browser's bookmark shortcut). Match the redo shortcut case-insensitively.
- `Header.tsx`: a Duplicate button beside Rotate and Delete, shown only with a selection. Keep the header diff small; E02 edits the header too.

## Out of scope

- Multi-select or duplicating several items (effort non-goal).
- Clamping copies to the garden bounds, or smarter placement that avoids overlap.
- Copy and paste, or a clipboard.
- Mac Cmd shortcuts; existing shortcuts use Ctrl only.

## Acceptance

- With an item selected, Ctrl+D adds one item of the same catalog type, size and rotation at x + 0.5, y + 0.5, and the copy is selected.
- Pressing Ctrl+D twice gives three items on a 0.5 m diagonal.
- The Duplicate button does the same; it is not shown without a selection.
- Ctrl+D with nothing selected, or while typing in an input, does nothing and does not open the browser's bookmark dialog.
- One undo removes the copy and leaves no selection pointing at a missing item; Ctrl+Shift+Z and the Redo button bring the copy back.
- `npm run test` and `npm run build` (includes `tsc --noEmit`) pass.

## Verification

Store tests for `duplicateItem` (copied fields, new id, offset, selection, one history entry) and a Canvas test for Ctrl+D and Ctrl+Shift+Z. Then `npm run dev -- --port 5192 --strictPort` and `playwright-cli -s=e03w open --browser=chromium …` (the default browser is denied on localhost): select a rotated item, press Ctrl+D twice, undo, redo with Ctrl+Shift+Z, reload. Report the stored positions.

## Notes

- `package.json` has no `lint` or `typecheck` script; do not add one in this change.
