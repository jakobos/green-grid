# Styleguide

## Stack

- Browser only. No server, no SSR.
- TypeScript strict mode, React 18+ with Vite.
- Tailwind CSS. No CSS modules, no styled-components.
- Zustand for state. Immutable snapshots for undo/redo. `persist` middleware for localStorage.
- Konva via react-konva for all garden rendering.
- shadcn/ui (copied in, not installed) on Radix primitives. Lucide React for icons.
- Vitest + React Testing Library.
- `playwright-cli` for live preview of the running app, browser testing, and visual checks.
- Every new dependency needs a one-line justification.

## Shape

- One component per file. File name matches component name in PascalCase.
- Co-locate component-specific hooks and utilities in the same directory.
- Shared components (used in more than one place) live in a shared directory, not next to one caller.
- Test files live next to the source: `<source>.test.ts` or `<source>.test.tsx`.
- A function does one thing. A hook owns one concern. If it needs a paragraph to explain, split it.
- Design tokens — colors, spacing, typography, shadows, radii — defined in `tailwind.config.ts` under `theme.extend`. No scattered overrides.

## Prefer

- `type` over `interface` for all type definitions. Props: `type <ComponentName>Props`. Destructure in the function signature.
- Union types (`'north' | 'south'`) over TypeScript enums.
- Explicit return types on exported functions. Internal helpers may rely on inference.
- Functional components only. Hooks for state and side effects.
- Tailwind classes for styling. `style` objects only where Konva or dynamic positioning requires them.
- Semantic token names by purpose (`primary`, `surface`, `muted`), not appearance (`blue-500`).
- Descriptive names that state intent. No cryptic abbreviations outside tight loops.
- Extract genuinely repeated logic. Don't abstract coincidental duplication.
- Tests assert what the user sees or the API returns, not internal state or private methods.
- Deterministic tests: no timing, network, or random values. Mock external deps, not the module under test.
- Conventional commits: `type(scope): description` in imperative, lowercase, no period.

## Avoid

- `any` — unless unavoidable and annotated with a comment explaining why.
- Class components, inline styles, CSS modules, styled-components.
- Snapshot tests — they break on unrelated changes and teach nothing.
- Dead code: unused imports, commented-out blocks, orphaned functions. Version control is the history.
- Future stubs, placeholder functions, speculative abstractions. Add them when a caller arrives.
- Hand-drawn aesthetic in the editor chrome — that belongs in the export only.
- Hardcoded color or spacing values in components. Everything through the theme config.

## Checks

- `npm run lint` — no warnings, no errors.
- `npm run typecheck` — strict mode, zero errors.
- `npm run test` — all tests pass, deterministic.
- `npm run build` — clean production build, no warnings.
