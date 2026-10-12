# Theme

## Design system
Use shadcn/ui components built on Radix primitives. Copy components into the project — do not install as a package dependency. All components use Tailwind classes.

## Visual direction
Clean minimal. Neutral palette, generous whitespace, subtle borders, no decoration. The canvas is the focus; the UI stays out of the way. The hand-drawn aesthetic belongs in the export, not the editor chrome.

## Single source of truth
Define all design tokens — colors, spacing, typography, shadows, border radii — in `tailwind.config.ts` under `theme.extend`. shadcn/ui CSS variables map to Tailwind tokens. No scattered overrides or hardcoded values in components.

## Semantic naming
Name tokens by purpose, not appearance: `primary`, `surface`, `muted`, `destructive` — not `blue-500` or `gray-200` in component code. Follow shadcn/ui's token conventions (`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`).

## Consistency
Use the defined tokens everywhere. A color, spacing value, or font size that does not come from the theme config is a bug.
