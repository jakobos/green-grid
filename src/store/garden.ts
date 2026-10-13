import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Garden, GardenItem, Viewport } from '@/types/garden'

type GardenStore = {
  garden: Garden
  viewport: Viewport
  setGardenName: (name: string) => void
  setGardenWidth: (widthMeters: number) => void
  setGardenHeight: (heightMeters: number) => void
  setViewport: (viewport: Viewport) => void
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
    }),
    { name: 'green-grid-garden' }
  )
)
