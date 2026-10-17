---
change_id: item-manipulation
title: Select, move, rotate, and delete items with undo and redo
type: feature
effort: mvp
slice: 3
status: archived
updated: 2026-10-17
archived_at: 2026-10-17
---

## Notes

Landed click-to-select with blue highlight border, drag-to-move with 1 m grid snap, R-key and button rotation in 90° increments, Delete/Backspace and button deletion, and full undo/redo (Ctrl+Z/Ctrl+Shift+Z, header buttons, 50-snapshot cap). Selection, history stacks, and undo/redo state are ephemeral — not persisted to localStorage. The `partialize` option on the Zustand persist middleware excludes them.
