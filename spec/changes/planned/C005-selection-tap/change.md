---
id: C005
effort:
slice:
depends: []
opened: 2026-10-22
---

# C005-selection-tap · Fix item selection for touch and pointer events

## Outcome

Item selection and canvas panning work on touch devices and trackpads the same as with a mouse. Tapping an item selects it; tapping empty canvas deselects. Touch-drag pans the canvas.

## Context

Click-to-select works for mouse events but fails on touch devices and some trackpads. Konva separates `click` (mouse) from `tap` (touch) — the code only handles `click`. Both the item click handler in `GardenItemShape` and the stage deselect handler in `Canvas` need `onTap` alongside `onClick`. The same gap applies to pan gesture handling (`mousedown`/`mousemove`/`mouseup` without `touchstart`/`touchmove`/`touchend`).

## Scope

- Add `onTap` handlers alongside `onClick` in `GardenItemShape` and `Canvas`
- Add touch event handlers for canvas panning

## Out of scope

- Pinch-to-zoom
- Multi-touch gestures

## Acceptance

- Tap an item on a touch device or touch-emulating trackpad; it selects.
- Tap empty canvas; selection clears.
- Touch-drag on empty canvas pans the view.

## Verification

`npm run typecheck`, `npm run test`. Manual: use browser DevTools touch emulation to verify tap-to-select, tap-to-deselect, and touch-drag-to-pan.
