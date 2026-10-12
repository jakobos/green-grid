# React

## Functional components only
No class components. Every component is a function. Use hooks for state and side effects.

## Reusable components
Extract repeated UI patterns into shared components. A component used in more than one place lives in a shared directory, not next to one caller.

## Props typing
Define props with a `type` (not `interface`). Name it `<ComponentName>Props`. Destructure props in the function signature.

## Component files
One component per file. The file name matches the component name in PascalCase. Co-locate component-specific hooks and utilities in the same directory.

## Hooks
Custom hooks start with `use`. Keep hooks focused — one concern per hook. A hook that needs a paragraph to explain is doing too much.

## No inline styles
Use Tailwind classes. Do not pass `style` objects except where Konva or dynamic positioning requires it.
