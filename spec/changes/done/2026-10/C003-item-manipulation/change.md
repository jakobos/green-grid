---
id: C003
effort: E01
slice: 3
depends: [C002]
opened: 2026-10-17
---

# C003-item-manipulation · Select, move, rotate, and delete items with undo and redo

## Outcome

A user clicks an item on the canvas to select it (blue highlight), drags to reposition with grid snap, presses R or a button to rotate in 90° steps, and presses Delete/Backspace or a button to remove it. Ctrl+Z and Ctrl+Shift+Z (plus header buttons) undo and redo all canvas actions, up to 50 snapshots.

## Context

Builds on placed items from slice 2. Selection and undo/redo state are ephemeral — not persisted to localStorage — to avoid stale state on reload.

## Scope

- Click-to-select with visual highlight (blue border)
- Drag-to-move with 1 m grid snap
- Rotate: R key and button, 90° increments, renders `rotationDeg`
- Delete: Delete/Backspace keys and button
- Undo/redo: Ctrl+Z / Ctrl+Shift+Z, header buttons, 50-snapshot cap
- `partialize` on Zustand persist to exclude selection and history

## Out of scope

- Touch/tap events for selection (separate defect: `selection-tap`)
- Multi-select or group operations

## Acceptance

- Click item to select; blue highlight appears.
- Drag selected item; it snaps to 1 m grid.
- Press R; item rotates 90°.
- Press Delete; item removed.
- Ctrl+Z undoes the last action; Ctrl+Shift+Z redoes.
- Undo/redo buttons in header work.
- Refresh page; items persist but selection and undo history clear.

## Verification

`npm run typecheck`, `npm run test`, `npm run build`. Manual: select, move, rotate, delete, undo, redo in the browser.
