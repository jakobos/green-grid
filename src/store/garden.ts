import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Garden, GardenItem, Viewport } from '@/types/garden'
import type { CatalogItem } from '@/types/garden'

type AddItemPayload = {
  catalogItem: CatalogItem
  xMeters: number
  yMeters: number
}

type GardenStore = {
  garden: Garden
  viewport: Viewport
  selectedItemId: string | null
  setGardenName: (name: string) => void
  setGardenWidth: (widthMeters: number) => void
  setGardenHeight: (heightMeters: number) => void
  setViewport: (viewport: Viewport) => void
  addItem: (payload: AddItemPayload) => void
  removeItem: (id: string) => void
  selectItem: (id: string) => void
  clearSelection: () => void
  moveItem: (id: string, xMeters: number, yMeters: number) => void
  rotateItem: (id: string) => void
  deleteItem: (id: string) => void
}

const now = new Date().toISOString()

const defaultGarden: Garden = {
  id: crypto.randomUUID(),
  name: 'My Garden',
  widthMeters: 20,
  heightMeters: 20,
  items: [] as GardenItem[],
  createdAt: now,
  updatedAt: now,
}

const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  scale: 1,
}

export const useGardenStore = create<GardenStore>()(
  persist(
    (set) => ({
      garden: defaultGarden,
      viewport: defaultViewport,
      selectedItemId: null,
      setGardenName: (name) =>
        set((state) => ({
          garden: { ...state.garden, name, updatedAt: new Date().toISOString() },
        })),
      setGardenWidth: (widthMeters) =>
        set((state) => ({
          garden: { ...state.garden, widthMeters, updatedAt: new Date().toISOString() },
        })),
      setGardenHeight: (heightMeters) =>
        set((state) => ({
          garden: { ...state.garden, heightMeters, updatedAt: new Date().toISOString() },
        })),
      setViewport: (viewport) => set({ viewport }),
      addItem: ({ catalogItem, xMeters, yMeters }) =>
        set((state) => {
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
            garden: {
              ...state.garden,
              items: [...state.garden.items, newItem],
              updatedAt: new Date().toISOString(),
            },
          }
        }),
      removeItem: (id) =>
        set((state) => ({
          garden: {
            ...state.garden,
            items: state.garden.items.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),
      selectItem: (id) => set({ selectedItemId: id }),
      clearSelection: () => set({ selectedItemId: null }),
      moveItem: (id, xMeters, yMeters) =>
        set((state) => ({
          garden: {
            ...state.garden,
            items: state.garden.items.map((item) =>
              item.id === id ? { ...item, xMeters, yMeters } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      rotateItem: (id) =>
        set((state) => ({
          garden: {
            ...state.garden,
            items: state.garden.items.map((item) =>
              item.id === id ? { ...item, rotationDeg: (item.rotationDeg + 90) % 360 } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      deleteItem: (id) =>
        set((state) => ({
          garden: {
            ...state.garden,
            items: state.garden.items.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedItemId: null,
        })),
    }),
    {
      name: 'green-grid-garden',
      partialize: (state) => ({ garden: state.garden, viewport: state.viewport }),
    }
  )
)
