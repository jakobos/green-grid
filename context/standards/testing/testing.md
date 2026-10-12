# Testing

## Framework
Vitest for unit and integration tests. React Testing Library for component tests. No Enzyme, no shallow rendering.

## Test behavior, not implementation
Tests assert what the user sees or what the API returns. Do not test internal state, private methods, or implementation details.

## File placement
Test files live next to the source file they test, named `<source>.test.ts` or `<source>.test.tsx`.

## Deterministic
Tests do not depend on timing, network, or random values. Mock external dependencies; do not mock the module under test.

## No snapshot tests
Snapshot tests break on unrelated changes and teach nothing. Test specific rendered output or behavior instead.
