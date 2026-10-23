---
id: E03
status: proposed
opened: 2026-10-23
---

# E03-editor-usability · Resize, customize, duplicate, search, and line items

## Problem

The editor can place, move, rotate and delete items, and nothing else. Positions snap to whole meters (`Math.round` in `Canvas.tsx` drop and `GardenItemShape.tsx` drag end), so a 0.2 m bulb can only sit on a 1 m lattice. An item's size is fixed at its catalog default: `widthMeters`/`heightMeters` are stored, but no action changes them. Every item is a circle or rectangle, so nothing can represent a path, road, pipe or cable run. There is no way to label an item or note its variety, no way to duplicate one, and with a growing catalog the sidebar has no search.

## Goal

A user can snap items to a 0.5 m grid and resize them with handles or exact numbers. They can set a label and notes on any placed item, duplicate a selection, and find catalog items by typing. They can also lay out linear features such as paths, pipes and cables as multi-point lines. All of this works with undo/redo and persists across reloads.

## Non-goals

- Touch and mobile interaction (tap, pinch, touch-pan). C005 stays parked in planned.
- Creating new catalog entries. The vision keeps the catalog built-in and curated; customization applies to placed items only.
- Multi-select, grouping, or alignment tools.
- Free-angle rotation; 90° steps stay.
- Expanding the catalog beyond the few line items needed to exercise lines (E04).

## Constraints

- Every mutating action goes through the existing snapshot undo/redo and the 50-snapshot cap.
- Data model changes bump the persist `version` and migrate existing localStorage gardens without loss.
- No modes: line items are created by drag-and-drop like every other item, not by a drawing tool.
- Keyboard shortcuts must not fire while typing in an input.

## Approach

- Snapping: one shared `snapToGrid(meters)` with `SNAP_STEP_METERS = 0.5`, used by drop, move, resize and line-vertex drags.
- Resize: Konva `Transformer` on the selected area item, with rotation disabled and the resulting size snapped.
- Item properties: a compact panel for the selected item with label, width, height and notes. Overrides live on the `GardenItem` and fall back to catalog defaults. The label also feeds the E02 on-plan labels.
- Duplicate: Ctrl+D and a button. The copy is offset by one snap step and becomes the selection.
- Catalog search: a filter input at the top of the sidebar that matches name and description and keeps the per-layer grouping.
- Line items: `GardenItem` becomes a union discriminated by `kind: 'area' | 'line'`. A line holds `points` in meters and a stroke width. Catalog entries gain `shape: 'line'`. Dropping a line item creates a two-point segment. Selecting it shows vertex handles; dragging a handle moves that vertex, and dragging a midpoint handle inserts a vertex. Lines render in the editor, the layer order and the E02 export.

## Decisions

<!-- Append-only: date · decision · why. Workers read this so they do not relitigate. -->
- 2026-10-23 · Position snap step is 0.5 m, replacing 1 m · user request; fits small items without free placement
- 2026-10-23 · Customization is per placed item (label, size, notes), never new catalog entries · vision "No custom item creation"
- 2026-10-23 · Lines are dropped as a segment and then edited by vertex handles, not drawn in a mode · vision "no modes"
- 2026-10-23 · Touch and mobile are out of scope for this effort · user request

## Roadmap

<!-- guild:roadmap — slice text is yours; marks and change ids are generated -->
1. [ ] Snap placement and movement to a 0.5 m grid
2. [ ] Catalog search in the sidebar
3. [ ] Duplicate the selected item
4. [ ] Resize area items with handles, snapped
5. [ ] Item properties panel: label, width, height, notes
6. [ ] Line items: drop, select, move, edit vertices, render in editor and export

## Risks and open questions

- Size snap: should sizes snap to 0.5 m like positions? 0.2 m bulbs would then grow to 0.5 m on first resize. A finer size step (0.1 m) may be needed.
- Line items touch the type, store, migration, canvas, hit testing and export at once. If slice 6 runs long, split it into "line model and rendering" and "vertex editing".
- If E02 slice 3 (on-plan labels) lands before slice 5 here, it shows catalog names until labels exist.
