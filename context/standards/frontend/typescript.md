# TypeScript

## Types over interfaces
Use `type` for all type definitions. Do not use `interface`. This keeps the codebase consistent and avoids accidental declaration merging.

## Strict mode
Enable `strict: true` in `tsconfig.json`. No `any` unless unavoidable and annotated with a comment explaining why.

## Explicit return types
Export functions and public API functions declare their return type. Internal helpers may rely on inference when the return is obvious.

## Enums
Prefer union types (`type Direction = 'north' | 'south' | 'east' | 'west'`) over TypeScript enums. Enums generate runtime code and have surprising edge cases.
