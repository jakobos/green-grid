import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Garden, GardenItem, Viewport, NorthDeg } from '@/types/garden'
import type { CatalogItem } from '@/types/garden'
import { POSITION_SNAP_METERS } from '@/lib/snap'

const HISTORY_LIMIT = 50

type AddItemPayload = {
  catalogItem: CatalogItem
  xMeters: number
  yMeters: number
}

type GardenStore = {
  gardens: Garden[]
  activeGardenId: string
  viewports: Record<string, Viewport>
  selectedItemId: string | null
  /** Snapshots of items before each mutating action (ephemeral). */
  past: GardenItem[][]
  /** Snapshots available to redo (ephemeral). */
  future: GardenItem[][]
  setGardenName: (name: string) => void
  setGardenWidth: (widthMeters: number) => void
  setGardenHeight: (heightMeters: number) => void
  setNorthDeg: (deg: NorthDeg) => void
  setViewport: (viewport: Viewport) => void
  addItem: (payload: AddItemPayload) => void
  removeItem: (id: string) => void
  selectItem: (id: string) => void
  clearSelection: () => void
  moveItem: (id: string, xMeters: number, yMeters: number) => void
  rotateItem: (id: string) => void
  deleteItem: (id: string) => void
  undo: () => void
  redo: () => void
  createGarden: () => void
  switchGarden: (id: string) => void
  deleteGarden: (id: string) => void
  duplicateItem: (id: string) => void
}

function makeGarden(name: string): Garden {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    widthMeters: 20,
    heightMeters: 20,
    northDeg: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  }
}

const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  scale: 1,
}

const initialGarden = makeGarden('My Garden')

/** Push current items onto past, cap at HISTORY_LIMIT, clear future. */
function pushHistory(
  past: GardenItem[][],
  currentItems: GardenItem[]
): { past: GardenItem[][]; future: GardenItem[][] } {
  const next = [...past, currentItems]
  return {
    past: next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next,
    future: [],
  }
}

/** Replace the active garden in the gardens array. */
function updateActiveGarden(
  gardens: Garden[],
  activeGardenId: string,
  updater: (garden: Garden) => Garden
): Garden[] {
  return gardens.map((g) => (g.id === activeGardenId ? updater(g) : g))
}

export const useGardenStore = create<GardenStore>()(
  persist(
    (set, get) => ({
      gardens: [initialGarden],
      activeGardenId: initialGarden.id,
      viewports: { [initialGarden.id]: defaultViewport },
      selectedItemId: null,
      past: [],
      future: [],

      setGardenName: (name) =>
        set((state) => ({
          gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
            ...g,
            name,
            updatedAt: new Date().toISOString(),
          })),
        })),

      setGardenWidth: (widthMeters) =>
        set((state) => ({
          gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
            ...g,
            widthMeters,
            updatedAt: new Date().toISOString(),
          })),
        })),

      setGardenHeight: (heightMeters) =>
        set((state) => ({
          gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
            ...g,
            heightMeters,
            updatedAt: new Date().toISOString(),
          })),
        })),

      setNorthDeg: (deg) =>
        set((state) => ({
          gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
            ...g,
            northDeg: deg,
            updatedAt: new Date().toISOString(),
          })),
        })),

      setViewport: (viewport) =>
        set((state) => ({
          viewports: { ...state.viewports, [state.activeGardenId]: viewport },
        })),

      addItem: ({ catalogItem, xMeters, yMeters }) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          const newItem: GardenItem = {
            id: crypto.randomUUID(),
            catalogId: catalogItem.catalogId,
            xMeters,
            yMeters,
            widthMeters: catalogItem.defaultWidthMeters,
            heightMeters: catalogItem.defaultHeightMeters,
            rotationDeg: 0,
          }
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: [...g.items, newItem],
              updatedAt: new Date().toISOString(),
            })),
          }
        }),

      removeItem: (id) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: g.items.filter((item) => item.id !== id),
              updatedAt: new Date().toISOString(),
            })),
          }
        }),

      selectItem: (id) => set({ selectedItemId: id }),
      clearSelection: () => set({ selectedItemId: null }),

      moveItem: (id, xMeters, yMeters) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: g.items.map((item) =>
                item.id === id ? { ...item, xMeters, yMeters } : item
              ),
              updatedAt: new Date().toISOString(),
            })),
          }
        }),

      rotateItem: (id) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: g.items.map((item) =>
                item.id === id ? { ...item, rotationDeg: (item.rotationDeg + 90) % 360 } : item
              ),
              updatedAt: new Date().toISOString(),
            })),
          }
        }),

      duplicateItem: (id) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          const original = garden.items.find((item) => item.id === id)
          if (!original) return {}
          const copy: GardenItem = {
            ...original,
            id: crypto.randomUUID(),
            xMeters: original.xMeters + POSITION_SNAP_METERS,
            yMeters: original.yMeters + POSITION_SNAP_METERS,
          }
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: [...g.items, copy],
              updatedAt: new Date().toISOString(),
            })),
            selectedItemId: copy.id,
          }
        }),

      deleteItem: (id) =>
        set((state) => {
          const garden = state.gardens.find((g) => g.id === state.activeGardenId)!
          return {
            ...pushHistory(state.past, garden.items),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: g.items.filter((item) => item.id !== id),
              updatedAt: new Date().toISOString(),
            })),
            selectedItemId: null,
          }
        }),

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return {}
          const previous = state.past[state.past.length - 1]
          const selectedStillExists = previous.some((item) => item.id === state.selectedItemId)
          return {
            past: state.past.slice(0, -1),
            future: [get().gardens.find((g) => g.id === state.activeGardenId)!.items, ...state.future],
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: previous,
              updatedAt: new Date().toISOString(),
            })),
            selectedItemId: selectedStillExists ? state.selectedItemId : null,
          }
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return {}
          const next = state.future[0]
          return {
            past: [...state.past, get().gardens.find((g) => g.id === state.activeGardenId)!.items],
            future: state.future.slice(1),
            gardens: updateActiveGarden(state.gardens, state.activeGardenId, (g) => ({
              ...g,
              items: next,
              updatedAt: new Date().toISOString(),
            })),
          }
        }),

      createGarden: () => {
        const garden = makeGarden('New Garden')
        set((state) => ({
          gardens: [...state.gardens, garden],
          activeGardenId: garden.id,
          viewports: { ...state.viewports, [garden.id]: { ...defaultViewport } },
          selectedItemId: null,
          past: [],
          future: [],
        }))
      },

      switchGarden: (id) =>
        set((state) => {
          if (id === state.activeGardenId) return {}
          if (!state.gardens.some((g) => g.id === id)) return {}
          return {
            activeGardenId: id,
            viewports: {
              ...state.viewports,
              [id]: state.viewports[id] ?? { ...defaultViewport },
            },
            selectedItemId: null,
            past: [],
            future: [],
          }
        }),

      deleteGarden: (id) =>
        set((state) => {
          if (state.gardens.length <= 1) return {}
          const remaining = state.gardens.filter((g) => g.id !== id)
          const newViewports = { ...state.viewports }
          delete newViewports[id]
          const needsSwitch = state.activeGardenId === id
          return {
            gardens: remaining,
            activeGardenId: needsSwitch ? remaining[0].id : state.activeGardenId,
            viewports: newViewports,
            selectedItemId: needsSwitch ? null : state.selectedItemId,
            past: needsSwitch ? [] : state.past,
            future: needsSwitch ? [] : state.future,
          }
        }),
    }),
    {
      name: 'green-grid-garden',
      version: 2,
      partialize: (state) => ({
        gardens: state.gardens,
        activeGardenId: state.activeGardenId,
        viewports: state.viewports,
      }),
      migrate: (persisted: unknown, version: number) => {
        let data = persisted

        // step 1: v0 → v1 shape (single-garden object → multi-garden array)
        if (version === 0) {
          type V0 = { garden?: Omit<Garden, 'northDeg'>; viewport?: Viewport }
          const old = data as V0
          const garden = old.garden ?? makeGarden('My Garden')
          const viewport = old.viewport ?? { ...defaultViewport }
          data = {
            gardens: [garden],
            activeGardenId: garden.id,
            viewports: { [garden.id]: viewport },
          }
        }

        // step 2: v0 and v1 → v2 (add northDeg: 0 to each garden; v0 falls through)
        if (version <= 1) {
          type V1Like = { gardens?: unknown; activeGardenId?: string; viewports?: unknown }
          const old = data as V1Like
          if (!Array.isArray(old?.gardens)) return persisted
          return {
            ...old,
            gardens: (old.gardens as Omit<Garden, 'northDeg'>[]).map((g) => ({ ...g, northDeg: 0 as const })),
          }
        }

        return data
      },
    }
  )
)

/** Select the active garden from the store. */
export function useActiveGarden(): Garden {
  return useGardenStore((state) => state.gardens.find((g) => g.id === state.activeGardenId)!)
}

/** Select the active garden's viewport from the store. */
export function useActiveViewport(): Viewport {
  return useGardenStore((state) => state.viewports[state.activeGardenId] ?? defaultViewport)
}
