# Plan: Scaffold, canvas, and GitHub Pages deploy

## Approach
Bootstrap the project with Vite + React + TypeScript + Tailwind + shadcn/ui + Zustand + react-konva. Render a meter-scale grid on a Konva stage with pan and zoom. A header bar shows editable garden name and dimensions. Zustand's `persist` middleware saves the garden and viewport state to localStorage. A GitHub Actions workflow deploys the built app to GitHub Pages on push to `main`.

## Assumptions
- Default new garden: 20 × 20 m, named "My Garden." The user changes these in the header.
- Grid cell size: 1 m. Not configurable in this slice.
- North direction and compass indicator: deferred to a later slice.
- Zoom range: 0.1× to 5×. Pan is unconstrained (the user can drag past the garden boundary).
- Garden boundary: a visible rectangle on the canvas showing the garden's width × height. Items outside the boundary are a later concern.
- shadcn/ui components copied into `src/components/ui/` per the theme standard.
- GitHub Actions deploys from `main` using `vite build` output. No custom domain.
- No item rendering, no layers, no drag-and-drop in this slice — that is slice 2.

## Data model

Persisted to localStorage via Zustand `persist`.

```typescript
type Garden = {
  id: string             // crypto.randomUUID()
  name: string           // user-editable, default "My Garden"
  widthMeters: number    // 1–100, default 20
  heightMeters: number   // 1–100, default 20
  items: []              // empty array, populated by slice 2
  createdAt: string      // ISO 8601
  updatedAt: string      // ISO 8601
}

type Viewport = {
  x: number              // stage offset in px
  y: number              // stage offset in px
  scale: number          // 0.1–5.0, default 1
}
```

Additive — no existing data. No migration needed.

## Standards to apply
- [ ] **Stack**: Vite + React 18+ + TS strict + Tailwind + Zustand (persist) + react-konva + shadcn/ui + Lucide React + Vitest
- [ ] **React**: functional components, typed props (`type`, not `interface`), one component per file, PascalCase filenames, no inline styles except Konva
- [ ] **TypeScript**: `strict: true`, union types over enums, explicit return types on exports
- [ ] **Theme**: shadcn/ui components, design tokens in `tailwind.config.ts`, semantic naming, neutral palette
- [ ] **Testing**: Vitest + RTL, co-located test files, behavior-focused, no snapshots
- [ ] **Coding style**: descriptive names, focused functions, no dead code, automatic formatting
- [ ] **Minimal implementation**: no future stubs, no speculative abstractions

## Priors & gotchas
No lessons recorded yet.

## Phases

### Phase 1: Project scaffold with header bar and persistence
Depends on: none

Bootstrap the Vite project with all dependencies. Set up Tailwind, shadcn/ui, and the Zustand store with `persist` middleware. Render an app shell: a header bar with editable garden name, width, and height fields, and an empty content area below. Verify that values persist across page reload.

Starting seam: `package.json`, `vite.config.ts`, `src/main.tsx`.

Tests: `src/store/garden.test.ts`, `src/components/Header.test.tsx`

### Phase 2: Grid canvas with pan and zoom
Depends on: 1

Add a Konva `Stage` filling the area below the header. Draw a meter-scale grid tied to the garden's dimensions. Render a visible garden boundary rectangle. Implement pan (drag on empty canvas) and zoom (scroll wheel, centered on cursor). The grid redraws on zoom to stay at 1 m intervals. Viewport state persists via the store.

Starting seam: `src/components/Canvas.tsx`, `src/components/Grid.tsx`.

Tests: `src/components/Canvas.test.tsx`

### Phase 3: GitHub Pages deploy
Depends on: 1

Add a GitHub Actions workflow that builds and deploys to GitHub Pages on push to `main`. Set `base` in `vite.config.ts` to the repository name. Verify the build succeeds.

Tests: none (CI workflow file; verified by build)

## Progress
> `- [ ]` pending, `- [x]` done. Append ` — <short-sha>` when a step lands in a commit.

### Phase 1: Project scaffold with header bar and persistence
#### Automated
- [ ] 1.1 (isolated) Vite dev server starts without errors
- [ ] 1.2 (isolated) TypeScript compiles with `strict: true`, zero errors
- [ ] 1.3 (isolated) Zustand store creates a default garden and round-trips through `persist`
- [ ] 1.4 (isolated) Header renders garden name, width, and height; editing updates the store
- [ ] 1.5 (isolated) `vitest run` passes
#### Manual
- [ ] 1.6 (agent-runnable) Open dev server, edit garden name and dimensions in header, refresh page, values restored

### Phase 2: Grid canvas with pan and zoom
#### Automated
- [ ] 2.1 (isolated) Canvas component renders a Konva Stage without errors
- [ ] 2.2 (isolated) `vitest run` passes
#### Manual
- [ ] 2.3 (agent-runnable) Grid lines visible at 1 m spacing; garden boundary rectangle visible
- [ ] 2.4 (agent-runnable) Drag to pan, scroll to zoom; grid redraws on zoom
- [ ] 2.5 (agent-runnable) Change garden dimensions in header; boundary updates on canvas
- [ ] 2.6 (agent-runnable) Refresh page; viewport position and zoom restored

### Phase 3: GitHub Pages deploy
#### Automated
- [ ] 3.1 (isolated) `vite build` completes without errors and `dist/` contains `index.html`
- [ ] 3.2 (isolated) GitHub Actions workflow file is valid YAML and references the correct build command
