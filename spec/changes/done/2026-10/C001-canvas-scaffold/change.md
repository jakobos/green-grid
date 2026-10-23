---
id: C001
effort: E01
slice: 1
depends: []
opened: 2026-10-12
---

# C001-canvas-scaffold · Scaffold, canvas, and GitHub Pages deploy

## Outcome

The project exists as a Vite + React + TypeScript app with a meter-scale grid canvas. A user sees a header bar with editable garden name and dimensions, and a Konva canvas below with 1 m grid lines, pan, zoom, and a visible garden boundary. Viewport and garden state persist to localStorage. GitHub Pages deploys on push to `main`.

## Context

Lead tracer for the MVP effort. Wires the full stack and proves the rendering, persistence, and deploy pipeline before any item logic.

## Scope

- Vite + React 18 + TS strict + Tailwind + shadcn/ui + Zustand (persist) + react-konva + Vitest
- Header bar: editable garden name, width, height
- Konva stage: 1 m grid, garden boundary rectangle, drag-to-pan, scroll-to-zoom
- localStorage persistence for garden and viewport state
- GitHub Actions workflow for Pages deploy

## Out of scope

- Items, layers, drag-and-drop placement (slice 2)
- North direction and compass indicator

## Acceptance

- Dev server starts; TypeScript compiles strict with zero errors.
- Grid lines visible at 1 m spacing; garden boundary rectangle visible.
- Drag to pan, scroll to zoom; grid redraws on zoom.
- Edit name and dimensions in header; boundary updates on canvas.
- Refresh page; all values and viewport restored.
- `vite build` succeeds; GitHub Actions workflow deploys.

## Verification

`npm run typecheck`, `npm run test`, `npm run build`. Manual: open dev server, edit fields, refresh, confirm persistence.
