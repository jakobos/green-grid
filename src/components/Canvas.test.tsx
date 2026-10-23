import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Canvas } from './Canvas'
import { useGardenStore } from '@/store/garden'
import type { Garden, GardenItem, Viewport } from '@/types/garden'

vi.mock('react-konva', () => ({
  Stage: ({ children, width, height }: { children?: React.ReactNode; width: number; height: number }) => (
    <div data-testid="konva-stage" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  Layer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="konva-layer">{children}</div>
  ),
}))

vi.mock('./Grid', () => ({
  Grid: () => <div data-testid="grid" />,
  PIXELS_PER_METER: 60,
}))

vi.mock('./GardenItemShape', () => ({
  GardenItemShape: ({ item }: { item: GardenItem }) => (
    <div data-testid="garden-item-shape" data-item-id={item.id} data-catalog-id={item.catalogId} />
  ),
}))

// ResizeObserver is not available in jsdom; provide a minimal mock.
const observerCallbacks = new Map<Element, ResizeObserverCallback>()

vi.stubGlobal('ResizeObserver', vi.fn((callback: ResizeObserverCallback) => {
  const instance = {
    observe: (el: Element) => {
      observerCallbacks.set(el, callback)
      callback([{ contentRect: { width: 800, height: 600 } } as ResizeObserverEntry], instance as unknown as ResizeObserver)
    },
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }
  return instance
}))

const testGarden: Garden = {
  id: 'test-id',
  name: 'Test Garden',
  widthMeters: 20,
  heightMeters: 20,
  items: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const testViewport: Viewport = { x: 0, y: 0, scale: 1 }

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
  observerCallbacks.clear()
})

describe('Canvas', () => {
  it('renders a Konva Stage without errors', () => {
    render(<Canvas />)
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
  })

  it('renders a Layer inside the Stage', () => {
    render(<Canvas />)
    // Grid layer + 5 garden layers = 6 total
    expect(screen.getAllByTestId('konva-layer').length).toBeGreaterThanOrEqual(1)
  })

  it('renders a Grid inside the Stage', () => {
    render(<Canvas />)
    expect(screen.getByTestId('grid')).toBeInTheDocument()
  })

  // fireEvent.drop can't carry clientX/clientY (read-only on DragEvent).
  // Dispatch a MouseEvent for 'drop' which accepts clientX/clientY via constructor.
  function dispatchDrop(
    element: Element,
    catalogId: string,
    clientX: number,
    clientY: number
  ): void {
    const event = new MouseEvent('drop', { bubbles: true, cancelable: true, clientX, clientY })
    Object.defineProperty(event, 'dataTransfer', {
      value: { getData: (key: string) => (key === 'application/x-catalog-id' ? catalogId : '') },
    })
    element.dispatchEvent(event)
  }

  describe('drop handler', () => {
    it('adds item with grid-snapped coordinates on drop', () => {
      render(<Canvas />)

      const container = screen.getByTestId('canvas-container')
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 100, top: 50, right: 900, bottom: 650,
        width: 800, height: 600, x: 100, y: 50, toJSON: () => {},
      })

      // clientX=220 → stageX=120; viewport (0,0) scale=1 → 120/60=2m
      // clientY=170 → stageY=120; 120/60=2m
      dispatchDrop(container, 'tree-apple', 220, 170)

      const state = useGardenStore.getState()
      const { items } = state.gardens.find((g) => g.id === state.activeGardenId)!
      expect(items).toHaveLength(1)
      expect(items[0].xMeters).toBe(2)
      expect(items[0].yMeters).toBe(2)
      expect(items[0].catalogId).toBe('tree-apple')
    })

    it('snaps fractional coords to the nearest 0.5 m', () => {
      render(<Canvas />)

      const container = screen.getByTestId('canvas-container')
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600,
        width: 800, height: 600, x: 0, y: 0, toJSON: () => {},
      })

      // clientX=95 → 95/60≈1.583m → snaps to 1.5
      // clientY=60 → 60/60=1.0m → snaps to 1.0
      dispatchDrop(container, 'tree-apple', 95, 60)

      const state = useGardenStore.getState()
      const { items } = state.gardens.find((g) => g.id === state.activeGardenId)!
      expect(items).toHaveLength(1)
      expect(items[0].xMeters).toBe(1.5)
      expect(items[0].yMeters).toBe(1)
    })

    it('ignores drop with unknown catalogId', () => {
      render(<Canvas />)

      const container = screen.getByTestId('canvas-container')
      dispatchDrop(container, 'does-not-exist', 100, 100)

      const state = useGardenStore.getState()
      expect(state.gardens.find((g) => g.id === state.activeGardenId)!.items).toHaveLength(0)
    })
  })

  describe('layer rendering', () => {
    it('renders 6 Konva layers: 1 grid + 5 garden layers', () => {
      render(<Canvas />)
      expect(screen.getAllByTestId('konva-layer')).toHaveLength(6)
    })

    it('renders placed items as GardenItemShape in the correct layer', () => {
      const item: GardenItem = {
        id: 'i1',
        catalogId: 'tree-apple',
        xMeters: 2,
        yMeters: 2,
        widthMeters: 4,
        heightMeters: 4,
        rotationDeg: 0,
      }
      useGardenStore.setState({
        gardens: [{ ...testGarden, items: [item] }],
        activeGardenId: testGarden.id,
        viewports: { [testGarden.id]: testViewport },
      })
      render(<Canvas />)
      const shape = screen.getByTestId('garden-item-shape')
      expect(shape).toHaveAttribute('data-item-id', 'i1')
      expect(shape).toHaveAttribute('data-catalog-id', 'tree-apple')
    })
  })
})

describe('Canvas keydown guard', () => {
  it('does not rotate or delete when keydown comes from an input element', () => {
    const item: GardenItem = {
      id: 'i1',
      catalogId: 'tree-apple',
      xMeters: 2,
      yMeters: 2,
      widthMeters: 4,
      heightMeters: 4,
      rotationDeg: 0,
    }
    useGardenStore.setState({
      gardens: [{ ...testGarden, items: [item] }],
      activeGardenId: testGarden.id,
      viewports: { [testGarden.id]: testViewport },
      selectedItemId: 'i1',
      past: [],
      future: [],
    })
    render(<Canvas />)

    // Create an input element as the event target
    const inputEl = document.createElement('input')
    document.body.appendChild(inputEl)

    // Fire 'r' from the input — should NOT rotate
    const rEvent = new KeyboardEvent('keydown', { key: 'r', bubbles: true })
    Object.defineProperty(rEvent, 'target', { value: inputEl })
    window.dispatchEvent(rEvent)

    let state = useGardenStore.getState()
    let garden = state.gardens.find((g) => g.id === state.activeGardenId)!
    expect(garden.items[0].rotationDeg).toBe(0)

    // Fire Backspace from the input — should NOT delete
    const bsEvent = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })
    Object.defineProperty(bsEvent, 'target', { value: inputEl })
    window.dispatchEvent(bsEvent)

    state = useGardenStore.getState()
    garden = state.gardens.find((g) => g.id === state.activeGardenId)!
    expect(garden.items).toHaveLength(1)

    document.body.removeChild(inputEl)
  })
})
