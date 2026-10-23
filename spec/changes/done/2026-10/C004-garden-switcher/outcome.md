# C004-garden-switcher · Create, rename, delete, and switch between gardens — outcome

Refactored the Zustand store from a single `garden` + `viewport` to `gardens: Garden[]`, `activeGardenId: string`, and `viewports: Record<string, Viewport>`. Added `createGarden`, `switchGarden`, and `deleteGarden` actions. Persist middleware gained `version: 1` with a migrate function that converts old single-garden localStorage to the new shape. A garden-switcher strip in the header provides create, select, rename, and delete. Undo stacks reset on switch. Deleting the last garden is prevented.
