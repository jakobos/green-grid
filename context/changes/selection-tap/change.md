---
change_id: selection-tap
title: Fix item selection for touch and pointer events
type: defect
effort: null
slice: null
status: new
created: 2026-10-22
updated: 2026-10-22
archived_at: null
---

## Notes

Click-to-select works for mouse events but fails on touch devices and some trackpads. Konva separates `click` (mouse) from `tap` (touch) — the code only handles `click`. Both the item click handler in `GardenItemShape` and the stage deselect handler in `Canvas` need `onTap` alongside `onClick`. The same gap applies to pan gesture handling (`mousedown`/`mousemove`/`mouseup` without `touchstart`/`touchmove`/`touchend`).
