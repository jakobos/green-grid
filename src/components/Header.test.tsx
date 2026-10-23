import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { useGardenStore } from '@/store/garden'
import { vi } from 'vitest'

vi.mock('@/export/exportGarden', () => ({ exportGarden: vi.fn() }))
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

describe('Header', () => {
  it('renders the garden name input', () => {
    render(<Header />)
    expect(screen.getByLabelText('Name')).toHaveValue('Test Garden')
  })

  it('renders the garden width', () => {
    render(<Header />)
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })

  it('renders the garden height', () => {
    render(<Header />)
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()
  })

  it('updates the store when name is edited', async () => {
    const user = userEvent.setup()
    render(<Header />)
    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Rose Garden')
    expect(activeGarden().name).toBe('Rose Garden')
  })

  it('updates the store when width is edited', () => {
    render(<Header />)
    const widthInput = screen.getByDisplayValue('20')
    fireEvent.change(widthInput, { target: { value: '50' } })
    expect(activeGarden().widthMeters).toBe(50)
  })

  it('updates the store when height is edited', () => {
    render(<Header />)
    const heightInput = screen.getByDisplayValue('30')
    fireEvent.change(heightInput, { target: { value: '40' } })
    expect(activeGarden().heightMeters).toBe(40)
  })

  it('ignores out-of-range values for width', () => {
    render(<Header />)
    const widthInput = screen.getByDisplayValue('20')
    fireEvent.change(widthInput, { target: { value: '200' } })
    expect(activeGarden().widthMeters).toBe(20)
  })

  it('does not show rotate and delete buttons when nothing is selected', () => {
    render(<Header />)
    expect(screen.queryByLabelText('Rotate item 90°')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delete item')).not.toBeInTheDocument()
  })

  it('shows rotate and delete buttons when an item is selected', () => {
    useGardenStore.setState({ selectedItemId: 'item-1' })
    render(<Header />)
    expect(screen.getByLabelText('Rotate item 90°')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete item')).toBeInTheDocument()
  })

  it('calls rotateItem when Rotate button is clicked', () => {
    useGardenStore.getState().addItem({ catalogItem: {
      catalogId: 'tree-apple', name: 'Apple Tree', description: '',
      layer: 5, defaultWidthMeters: 4, defaultHeightMeters: 4,
      shape: 'circle', color: '#2D5A27', estimatedCostEur: 35,
    }, xMeters: 0, yMeters: 0 })
    const id = activeGarden().items[0].id
    useGardenStore.setState({ selectedItemId: id })
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Rotate item 90°'))
    expect(activeGarden().items[0].rotationDeg).toBe(90)
  })

  it('calls deleteItem when Delete button is clicked', () => {
    useGardenStore.getState().addItem({ catalogItem: {
      catalogId: 'tree-apple', name: 'Apple Tree', description: '',
      layer: 5, defaultWidthMeters: 4, defaultHeightMeters: 4,
      shape: 'circle', color: '#2D5A27', estimatedCostEur: 35,
    }, xMeters: 0, yMeters: 0 })
    const id = activeGarden().items[0].id
    useGardenStore.setState({ selectedItemId: id })
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Delete item'))
    expect(activeGarden().items).toHaveLength(0)
    expect(useGardenStore.getState().selectedItemId).toBeNull()
  })

  it('undo button is disabled when there is no history', () => {
    render(<Header />)
    expect(screen.getByLabelText('Undo')).toBeDisabled()
  })

  it('redo button is disabled when there is no future', () => {
    render(<Header />)
    expect(screen.getByLabelText('Redo')).toBeDisabled()
  })

  it('undo button is enabled after an action', () => {
    useGardenStore.getState().addItem({ catalogItem: {
      catalogId: 'tree-apple', name: 'Apple Tree', description: '',
      layer: 5, defaultWidthMeters: 4, defaultHeightMeters: 4,
      shape: 'circle', color: '#2D5A27', estimatedCostEur: 35,
    }, xMeters: 0, yMeters: 0 })
    render(<Header />)
    expect(screen.getByLabelText('Undo')).not.toBeDisabled()
  })

  it('redo button is enabled after undo', () => {
    useGardenStore.getState().addItem({ catalogItem: {
      catalogId: 'tree-apple', name: 'Apple Tree', description: '',
      layer: 5, defaultWidthMeters: 4, defaultHeightMeters: 4,
      shape: 'circle', color: '#2D5A27', estimatedCostEur: 35,
    }, xMeters: 0, yMeters: 0 })
    useGardenStore.getState().undo()
    render(<Header />)
    expect(screen.getByLabelText('Redo')).not.toBeDisabled()
  })

  it('calls undo when Undo button is clicked', () => {
    useGardenStore.getState().addItem({ catalogItem: {
      catalogId: 'tree-apple', name: 'Apple Tree', description: '',
      layer: 5, defaultWidthMeters: 4, defaultHeightMeters: 4,
      shape: 'circle', color: '#2D5A27', estimatedCostEur: 35,
    }, xMeters: 0, yMeters: 0 })
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Undo'))
    expect(activeGarden().items).toHaveLength(0)
  })

  it('renders the garden selector', () => {
    render(<Header />)
    expect(screen.getByLabelText('Select garden')).toBeInTheDocument()
  })

  it('creates a new garden when New button is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('New garden'))
    expect(useGardenStore.getState().gardens).toHaveLength(2)
    expect(useGardenStore.getState().activeGardenId).not.toBe('test-id')
  })

  it('disables delete when only one garden exists', () => {
    render(<Header />)
    expect(screen.getByLabelText('Delete garden')).toBeDisabled()
  })

  it('enables delete when multiple gardens exist', () => {
    useGardenStore.getState().createGarden()
    render(<Header />)
    expect(screen.getByLabelText('Delete garden')).not.toBeDisabled()
  })
})

describe('Header export', () => {
  it('exports the active garden when Export PNG is clicked', async () => {
    const { exportGarden } = await import('@/export/exportGarden')
    render(<Header />)
    await userEvent.click(screen.getByRole('button', { name: 'Export PNG' }))
    await waitFor(() => expect(exportGarden).toHaveBeenCalledWith(activeGarden(), expect.any(Array)))
  })
})
