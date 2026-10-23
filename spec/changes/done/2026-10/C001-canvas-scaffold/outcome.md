# C001-canvas-scaffold · Scaffold, canvas, and GitHub Pages deploy — outcome

Bootstrapped the project with Vite, React 18, TypeScript strict, Tailwind, shadcn/ui, Zustand with persist middleware, react-konva, and Vitest. The app renders a header bar with editable garden name and dimensions and a Konva canvas with 1 m grid lines, a garden boundary rectangle, drag-to-pan, and scroll-to-zoom. Garden and viewport state persist to localStorage across reloads. A GitHub Actions workflow deploys to Pages on push to `main`. Default garden is 20 × 20 m named "My Garden".
