---
id: C002
effort: E01
slice: 2
depends: [C001]
opened: 2026-10-17
---

# C002-item-placement · Item catalog and drag-and-drop placement

## Outcome

A user drags items from a sidebar palette onto the garden canvas. The palette shows a built-in catalog of ~15 items across all five layers, grouped by layer. Items land on the canvas at the drop position with grid snapping and render in layer order. Placed items persist to localStorage.

## Context

Builds on the canvas and store from the scaffold (slice 1). The catalog is fixed and curated per the vision; no custom items.

## Scope

- Built-in catalog of ~15 items spanning all five layers
- Collapsible sidebar palette with per-layer sections
- HTML5 drag from palette, drop onto Konva canvas with coordinate conversion
- Grid snapping on drop (1 m)
- Layer-order rendering on canvas
- `addItem` and `removeItem` store actions
- Item persistence in localStorage

## Out of scope

- Select, move, rotate, delete on canvas (slice 3)
- Item rotation rendering (`rotationDeg` stored but not rendered)

## Acceptance

- Sidebar shows items grouped by layer; sections collapse.
- Drag an item from palette to canvas; it lands at the correct position with grid snap.
- Items render in layer order (underground below trees).
- Placed items survive page reload.

## Verification

`npm run typecheck`, `npm run test`, `npm run build`. Manual: drag items from each layer, verify positioning and persistence.
