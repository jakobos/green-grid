# Stack

The agreed technology choices for this project.

## Core

- **Runtime:** Browser only. No server, no SSR.
- **Language:** TypeScript (strict mode).
- **Framework:** React 18+ with Vite.
- **Styling:** Tailwind CSS. No CSS modules, no styled-components.
- **State:** Zustand. Immutable snapshots for undo/redo. `persist` middleware for localStorage.
- **Canvas:** Konva via react-konva. All garden rendering goes through the Konva stage.
- **Icons:** Lucide React. No other icon library.
- **Testing:** Vitest + React Testing Library.

## Dependency policy

Every new dependency needs a one-line justification in the PR. Prefer what is already in the stack before adding a package.
