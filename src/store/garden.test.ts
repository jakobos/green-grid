import { describe, it, expect, beforeEach } from 'vitest'
import { useGardenStore } from './garden'
import type { CatalogItem, Garden, Viewport } from '@/types/garden'

const testGarden: Garden = {
  id: 'test-id',
  name: 'Test Garden',
  widthMeters: 20,
  heightMeters: 30,
  items: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const testViewport: Viewport = { x: 0, y: 0, scale: 1 }

const testCatalogItem: CatalogItem = {
  catalogId: 'tree-apple',
  name: 'Apple Tree',
  description: 'Deciduous fruit tree.',
  layer: 5,
  defaultWidthMeters: 4.0,
  defaultHeightMeters: 4.0,
  shape: 'circle',
  color: '#2D5A27',
  estimatedCostEur: 35.0,
}

beforeEach(() => {
  useGardenStore.setState({ garden: testGarden, viewport: testViewport, selectedItemId: null })
  localStorage.clear()
})

describe('useGardenStore', () => {
  it('creates a default garden with expected shape', () => {
    const { garden } = useGardenStore.getState()
    expect(garden.name).toBe('Test Garden')
    expect(garden.widthMeters).toBe(20)
    expect(garden.heightMeters).toBe(30)
    expect(garden.items).toHaveLength(0)
  })

  it('updates garden name', () => {
    useGardenStore.getState().setGardenName('Rose Garden')
    expect(useGardenStore.getState().garden.name).toBe('Rose Garden')
  })

  it('updates garden width', () => {
    useGardenStore.getState().setGardenWidth(50)
    expect(useGardenStore.getState().garden.widthMeters).toBe(50)
  })

  it('updates garden height', () => {
    useGardenStore.getState().setGardenHeight(15)
    expect(useGardenStore.getState().garden.heightMeters).toBe(15)
  })

  it('persists state to localStorage after an action', () => {
    useGardenStore.getState().setGardenName('Persisted Garden')
    const raw = localStorage.getItem('green-grid-garden')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { state: { garden: Garden } }
    expect(parsed.state.garden.name).toBe('Persisted Garden')
  })

  describe('addItem', () => {
    it('creates a GardenItem with a UUID and snapped coordinates', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 3, yMeters: 7 })
      const { items } = useGardenStore.getState().garden
      expect(items).toHaveLength(1)
      const item = items[0]
      expect(item.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(item.catalogId).toBe('tree-apple')
      expect(item.xMeters).toBe(3)
      expect(item.yMeters).toBe(7)
      expect(item.widthMeters).toBe(4.0)
      expect(item.heightMeters).toBe(4.0)
      expect(item.rotationDeg).toBe(0)
    })

    it('appends multiple items without overwriting', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 5, yMeters: 5 })
      expect(useGardenStore.getState().garden.items).toHaveLength(2)
    })

    it('assigns unique IDs to each item', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 1, yMeters: 1 })
      const { items } = useGardenStore.getState().garden
      expect(items[0].id).not.toBe(items[1].id)
    })
  })

  describe('removeItem', () => {
    it('removes an item by id', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const { items } = useGardenStore.getState().garden
      const id = items[0].id
      useGardenStore.getState().removeItem(id)
      expect(useGardenStore.getState().garden.items).toHaveLength(0)
    })

    it('leaves other items intact when removing one', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 5, yMeters: 5 })
      const { items } = useGardenStore.getState().garden
      const firstId = items[0].id
      useGardenStore.getState().removeItem(firstId)
      const remaining = useGardenStore.getState().garden.items
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).not.toBe(firstId)
    })
  })
  describe('selectItem / clearSelection', () => {
    it('sets selectedItemId to the given id', () => {
      useGardenStore.getState().selectItem('item-abc')
      expect(useGardenStore.getState().selectedItemId).toBe('item-abc')
    })

    it('clears selectedItemId to null', () => {
      useGardenStore.getState().selectItem('item-abc')
      useGardenStore.getState().clearSelection()
      expect(useGardenStore.getState().selectedItemId).toBeNull()
    })

    it('replaces selection when selecting a different item', () => {
      useGardenStore.getState().selectItem('item-1')
      useGardenStore.getState().selectItem('item-2')
      expect(useGardenStore.getState().selectedItemId).toBe('item-2')
    })

    it('does not persist selectedItemId to localStorage', () => {
      useGardenStore.getState().selectItem('item-abc')
      const raw = localStorage.getItem('green-grid-garden')
      if (raw) {
        const parsed = JSON.parse(raw) as { state: Record<string, unknown> }
        expect(parsed.state).not.toHaveProperty('selectedItemId')
      }
    })
  })

  describe('moveItem', () => {
    it('updates xMeters and yMeters for the given item', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const { items } = useGardenStore.getState().garden
      const id = items[0].id
      useGardenStore.getState().moveItem(id, 5, 3)
      const moved = useGardenStore.getState().garden.items[0]
      expect(moved.xMeters).toBe(5)
      expect(moved.yMeters).toBe(3)
    })

    it('leaves other items unchanged when moving one', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 2, yMeters: 2 })
      const { items } = useGardenStore.getState().garden
      const firstId = items[0].id
      useGardenStore.getState().moveItem(firstId, 10, 10)
      const second = useGardenStore.getState().garden.items[1]
      expect(second.xMeters).toBe(2)
      expect(second.yMeters).toBe(2)
    })
  })
})
