import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Canvas } from './Canvas'
import { useGardenStore } from '@/store/garden'
import type { Garden, Viewport } from '@/types/garden'

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

// ResizeObserver is not available in jsdom; provide a minimal mock.
const observerCallbacks = new Map<Element, ResizeObserverCallback>()
const mockObserver = {
  observe: vi.fn((el: Element) => {
    const callback = observerCallbacks.get(el)
    if (callback) {
      callback([{ contentRect: { width: 800, height: 600 } } as ResizeObserverEntry], mockObserver as unknown as ResizeObserver)
    }
  }),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}

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
  useGardenStore.setState({ garden: testGarden, viewport: testViewport })
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
    expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
  })

  it('renders a Grid inside the Layer', () => {
    render(<Canvas />)
    expect(screen.getByTestId('grid')).toBeInTheDocument()
  })
})
