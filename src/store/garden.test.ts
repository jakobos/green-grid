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

/** Get the active garden from the store. */
function activeGarden(): Garden {
  const state = useGardenStore.getState()
  return state.gardens.find((g) => g.id === state.activeGardenId)!
}

beforeEach(() => {
  useGardenStore.setState({
    gardens: [testGarden],
    activeGardenId: testGarden.id,
    viewports: { [testGarden.id]: testViewport },
    selectedItemId: null,
    past: [],
    future: [],
  })
  localStorage.clear()
})

describe('useGardenStore', () => {
  it('creates a default garden with expected shape', () => {
    const garden = activeGarden()
    expect(garden.name).toBe('Test Garden')
    expect(garden.widthMeters).toBe(20)
    expect(garden.heightMeters).toBe(30)
    expect(garden.items).toHaveLength(0)
  })

  it('updates garden name', () => {
    useGardenStore.getState().setGardenName('Rose Garden')
    expect(activeGarden().name).toBe('Rose Garden')
  })

  it('updates garden width', () => {
    useGardenStore.getState().setGardenWidth(50)
    expect(activeGarden().widthMeters).toBe(50)
  })

  it('updates garden height', () => {
    useGardenStore.getState().setGardenHeight(15)
    expect(activeGarden().heightMeters).toBe(15)
  })

  it('persists state to localStorage after an action', () => {
    useGardenStore.getState().setGardenName('Persisted Garden')
    const raw = localStorage.getItem('green-grid-garden')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { state: { gardens: Garden[] } }
    expect(parsed.state.gardens[0].name).toBe('Persisted Garden')
  })

  describe('addItem', () => {
    it('creates a GardenItem with a UUID and snapped coordinates', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 3, yMeters: 7 })
      const { items } = activeGarden()
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
      expect(activeGarden().items).toHaveLength(2)
    })

    it('assigns unique IDs to each item', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 1, yMeters: 1 })
      const { items } = activeGarden()
      expect(items[0].id).not.toBe(items[1].id)
    })
  })

  describe('removeItem', () => {
    it('removes an item by id', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const id = activeGarden().items[0].id
      useGardenStore.getState().removeItem(id)
      expect(activeGarden().items).toHaveLength(0)
    })

    it('leaves other items intact when removing one', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 5, yMeters: 5 })
      const firstId = activeGarden().items[0].id
      useGardenStore.getState().removeItem(firstId)
      const remaining = activeGarden().items
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
      const id = activeGarden().items[0].id
      useGardenStore.getState().moveItem(id, 5, 3)
      const moved = activeGarden().items[0]
      expect(moved.xMeters).toBe(5)
      expect(moved.yMeters).toBe(3)
    })

    it('leaves other items unchanged when moving one', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 2, yMeters: 2 })
      const firstId = activeGarden().items[0].id
      useGardenStore.getState().moveItem(firstId, 10, 10)
      const second = activeGarden().items[1]
      expect(second.xMeters).toBe(2)
      expect(second.yMeters).toBe(2)
    })
  })

  describe('rotateItem', () => {
    it('increments rotationDeg by 90', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const id = activeGarden().items[0].id
      useGardenStore.getState().rotateItem(id)
      expect(activeGarden().items[0].rotationDeg).toBe(90)
    })

    it('wraps at 360', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const id = activeGarden().items[0].id
      useGardenStore.getState().rotateItem(id)
      useGardenStore.getState().rotateItem(id)
      useGardenStore.getState().rotateItem(id)
      useGardenStore.getState().rotateItem(id)
      expect(activeGarden().items[0].rotationDeg).toBe(0)
    })

    it('leaves other items unchanged', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 1, yMeters: 1 })
      useGardenStore.getState().rotateItem(activeGarden().items[0].id)
      expect(activeGarden().items[1].rotationDeg).toBe(0)
    })
  })

  describe('deleteItem', () => {
    it('removes the item and clears selectedItemId', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      const id = activeGarden().items[0].id
      useGardenStore.getState().selectItem(id)
      useGardenStore.getState().deleteItem(id)
      expect(activeGarden().items).toHaveLength(0)
      expect(useGardenStore.getState().selectedItemId).toBeNull()
    })

    it('leaves other items intact', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 5, yMeters: 5 })
      const items = activeGarden().items
      useGardenStore.getState().deleteItem(items[0].id)
      expect(activeGarden().items).toHaveLength(1)
      expect(activeGarden().items[0].id).toBe(items[1].id)
    })
  })

  describe('undo / redo', () => {
    it('undo after addItem restores the previous items array', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      expect(activeGarden().items).toHaveLength(1)
      useGardenStore.getState().undo()
      expect(activeGarden().items).toHaveLength(0)
    })

    it('redo after undo restores the undone state', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().undo()
      expect(activeGarden().items).toHaveLength(0)
      useGardenStore.getState().redo()
      expect(activeGarden().items).toHaveLength(1)
    })

    it('history caps at 50 entries; oldest dropped', () => {
      for (let i = 0; i < 55; i++) {
        useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: i, yMeters: 0 })
      }
      expect(useGardenStore.getState().past).toHaveLength(50)
    })

    it('undo does nothing when history is empty', () => {
      useGardenStore.getState().undo()
      expect(activeGarden().items).toHaveLength(0)
    })

    it('redo does nothing when future is empty', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().redo()
      expect(activeGarden().items).toHaveLength(1)
    })

    it('mutating after undo clears the redo future', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().undo()
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 1, yMeters: 1 })
      expect(useGardenStore.getState().future).toHaveLength(0)
    })
  })

  describe('createGarden', () => {
    it('adds a new garden and switches to it', () => {
      useGardenStore.getState().createGarden()
      const state = useGardenStore.getState()
      expect(state.gardens).toHaveLength(2)
      expect(state.activeGardenId).not.toBe('test-id')
      expect(activeGarden().name).toBe('New Garden')
    })

    it('resets undo/redo stacks', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      expect(useGardenStore.getState().past).toHaveLength(1)
      useGardenStore.getState().createGarden()
      expect(useGardenStore.getState().past).toHaveLength(0)
      expect(useGardenStore.getState().future).toHaveLength(0)
    })
  })

  describe('switchGarden', () => {
    it('changes the active garden', () => {
      useGardenStore.getState().createGarden()
      const newId = useGardenStore.getState().activeGardenId
      useGardenStore.getState().switchGarden('test-id')
      expect(useGardenStore.getState().activeGardenId).toBe('test-id')
      useGardenStore.getState().switchGarden(newId)
      expect(useGardenStore.getState().activeGardenId).toBe(newId)
    })

    it('resets undo/redo and selection on switch', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().selectItem(activeGarden().items[0].id)
      useGardenStore.getState().createGarden()
      useGardenStore.getState().switchGarden('test-id')
      expect(useGardenStore.getState().past).toHaveLength(0)
      expect(useGardenStore.getState().future).toHaveLength(0)
      expect(useGardenStore.getState().selectedItemId).toBeNull()
    })

    it('ignores switch to the same garden', () => {
      useGardenStore.getState().addItem({ catalogItem: testCatalogItem, xMeters: 0, yMeters: 0 })
      useGardenStore.getState().switchGarden('test-id')
      // past should not have been cleared
      expect(useGardenStore.getState().past).toHaveLength(1)
    })

    it('ignores switch to a nonexistent garden', () => {
      useGardenStore.getState().switchGarden('nonexistent')
      expect(useGardenStore.getState().activeGardenId).toBe('test-id')
    })
  })

  describe('deleteGarden', () => {
    it('removes the garden and switches to the first remaining', () => {
      useGardenStore.getState().createGarden()
      const newId = useGardenStore.getState().activeGardenId
      useGardenStore.getState().deleteGarden(newId)
      expect(useGardenStore.getState().gardens).toHaveLength(1)
      expect(useGardenStore.getState().activeGardenId).toBe('test-id')
    })

    it('does not delete the last garden', () => {
      useGardenStore.getState().deleteGarden('test-id')
      expect(useGardenStore.getState().gardens).toHaveLength(1)
      expect(useGardenStore.getState().activeGardenId).toBe('test-id')
    })

    it('cleans up viewport for the deleted garden', () => {
      useGardenStore.getState().createGarden()
      const newId = useGardenStore.getState().activeGardenId
      useGardenStore.getState().deleteGarden(newId)
      expect(useGardenStore.getState().viewports).not.toHaveProperty(newId)
    })
  })

  describe('migration', () => {
    it('migrates v0 single-garden to v1 multi-garden', () => {
      const v0Garden: Garden = {
        id: 'migrated-id',
        name: 'Old Garden',
        widthMeters: 15,
        heightMeters: 25,
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      const v0Viewport: Viewport = { x: 10, y: 20, scale: 2 }
      localStorage.setItem(
        'green-grid-garden',
        JSON.stringify({ state: { garden: v0Garden, viewport: v0Viewport }, version: 0 })
      )
      // Force rehydration
      useGardenStore.persist.rehydrate()
      const state = useGardenStore.getState()
      expect(state.gardens).toHaveLength(1)
      expect(state.gardens[0].id).toBe('migrated-id')
      expect(state.gardens[0].name).toBe('Old Garden')
      expect(state.activeGardenId).toBe('migrated-id')
      expect(state.viewports['migrated-id']).toEqual(v0Viewport)
    })
  })
})
