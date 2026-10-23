---
id: E01
status: active
opened: 2026-10-12
---

# E01-mvp · First working version of Green Grid
## Problem

No usable garden-layout tool exists that runs entirely in the browser. The vision calls for a local-only app where a user places catalog items on a layered grid canvas and exports a printable garden plan.

## Goal

Deliver a usable browser app where a user creates one or more gardens, sets dimensions, places items from a built-in catalog onto a layered grid canvas, and exports a single-page image that works as a printed garden plan. The app runs entirely in the browser with localStorage persistence.

## Non-goals

- Custom item creation; the catalog is built-in and curated.
- Backend, authentication, or cloud sync.
- Real-time collaboration or sharing.
- Hand-drawn export style (deferred to a follow-up effort).

## Constraints

- Browser only. No server, no SSR.
- TypeScript strict mode, React 18+, Vite, Zustand, react-konva, Tailwind, shadcn/ui.
- All data in localStorage.
- Maximum garden size 100 × 100 m.

## Approach

Five vertical slices, each building on the last: scaffold with grid canvas, item catalog and placement, item manipulation with undo/redo, multi-garden management, and export to image.

## Decisions

- 2026-10-12 · Grid cell size fixed at 1 m, not configurable · simplicity for MVP
- 2026-10-12 · Zoom range 0.1×–5×, unconstrained pan · defer boundary clamping
- 2026-10-17 · Selection, undo/redo state ephemeral (not persisted) · avoids stale state on reload
- 2026-10-19 · Undo stacks reset on garden switch · per-editing-session, not per-garden

## Roadmap

<!-- guild:roadmap — slice text is yours; marks and change ids are generated -->
1. [x] Scaffold, canvas, and GitHub Pages deploy — C001-canvas-scaffold — C001
2. [x] Item catalog and drag-and-drop placement — C002-item-placement — C002
3. [x] Item manipulation: select, move, rotate, delete, undo/redo — C003-item-manipulation — C003
4. [x] Multi-garden management: create, rename, delete, switch — C004-garden-switcher — C004
5. [~] Export to image: PNG/SVG with grid, items, legend, dimensions, compass, title — C006 (active)

## Risks and open questions

- Export layout for gardens larger than A4 (multi-page split) is not yet designed.
