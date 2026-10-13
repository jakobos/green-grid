import { describe, it, expect, beforeEach } from 'vitest'
import { useGardenStore } from './garden'
import type { Garden, Viewport } from '@/types/garden'

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

beforeEach(() => {
  useGardenStore.setState({ garden: testGarden, viewport: testViewport })
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
})
