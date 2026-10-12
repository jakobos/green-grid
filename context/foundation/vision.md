# Vision

> Human-owned durable intent for every role.

## Product principles

- Intuitive drag-and-drop interaction. No manuals, no modes, no menus deeper than one level.
- Every item knows its own layer. The user places things; the app sorts them.
- Offline-first, local-only data. Gardens, settings, and preferences live in localStorage. No server, no account.
- The downloaded output is the product. It must look like a hand-drawn garden map: readable, complete, and worth printing.
- Minimal UI, maximum canvas. The garden is the interface; controls stay out of the way.

## Product description

Green Grid is a browser app for designing garden layouts. A user creates a garden, sets its dimensions in meters, and places items on a scrollable, grid-backed canvas.

### Layers

Every garden has five layers, rendered bottom to top:

1. **Underground installations** — pipes, electricity cables, irrigation lines.
2. **Ground level** — grass, pavement, paths, decking.
3. **Ground items** — lamps, sprinklers, benches, photovoltaic panels.
4. **Low plants** — flowers, low hedges, bushes.
5. **Trees** — trees of varying canopy size.

Each item belongs to a fixed layer. The user does not choose the layer when placing an item.

### Canvas

- Dimensions set in meters; the grid reflects real-world scale. Maximum garden size is 100 × 100 m.
- The user sets the north direction; a compass indicator shows orientation.
- When the garden exceeds the viewport, the canvas scrolls to reveal hidden areas.
- A visible grid helps alignment and gives a sense of scale. Items snap to the grid.
- Zoom in and out to navigate large gardens or work on fine detail.

### Items

- Items come from a built-in catalog; the user cannot add custom items.
- Items have defined shapes and sizes. The user can rotate items.
- The user drags items from a palette onto the canvas.
- Items can be repositioned, resized where it makes sense, rotated, and removed.
- Items can overlap across layers (a lamp on pavement). Overlap within a single layer is allowed.
- Each item carries metadata: name, description, estimated cost, and type-specific fields (e.g. age for plants).
- Undo and redo for all canvas actions.

### Export

The main output is a downloadable file — an image or an HTML document — that serves as a finished garden plan. The export targets A4 paper size. When a garden is larger than one sheet, the export splits it across multiple sheets. The export includes:

- A hand-drawn map style, visually appealing and print-ready.
- All dimensions and item sizes annotated.
- A legend identifying every item type.
- North / south / east / west compass directions.
- A label or title for the garden.

### Data storage

The user can create and switch between multiple gardens. All data — gardens, user settings — is stored in the browser's localStorage. No backend. No authentication.

## Current direction

- Build the core canvas with grid, layers, drag-and-drop placement, and scrolling.
- Deliver a working export that produces a styled, readable garden map.
- Keep the item catalog small and curated at first; expand once the interaction model is solid.
