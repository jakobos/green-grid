## Roadmap
> A slice is **done** when its child change is archived (`archived_at` set) —
> derived by scanning the child, never a hand-checked box.

### Slice 1: Scaffold, canvas, and GitHub Pages deploy
- change: canvas-scaffold
- why: Lead tracer — wires the full stack, renders a grid canvas with pan/zoom/snap, persists one garden to localStorage, and deploys to GitHub Pages. Every later slice builds on this.
- next: `/dx-new mvp 1`

### Slice 2: Item catalog and placement
- change: item-placement
- why: Needs the canvas and Zustand store from slice 1. Adds a sidebar palette with ~10–15 built-in items across all five layers, drag-and-drop onto the canvas, layer-order rendering, and item persistence.
- next: `/dx-new mvp 2`

### Slice 3: Item manipulation
- change: item-manipulation
- why: Needs placed items from slice 2. Adds select, move, rotate, and delete on canvas. Adds undo/redo for all canvas actions.
- next: `/dx-new mvp 3`

### Slice 4: Multi-garden management
- change: garden-switcher
- why: Needs the persistence model from slice 1. Placed after slice 3 so switching gardens is useful — there is something to build in each garden. Adds create, rename, delete, and switch between gardens.
- next: `/dx-new mvp 4`

### Slice 5: Export to image
- change: garden-export
- why: Needs the full editing flow from slices 2–3. Downloads a single-page PNG/SVG with grid, items, legend, dimension annotations, compass, and garden title.
- next: `/dx-new mvp 5`
