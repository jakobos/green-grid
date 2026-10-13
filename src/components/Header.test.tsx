import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { useGardenStore } from '@/store/garden'
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

describe('Header', () => {
  it('renders the garden name', () => {
    render(<Header />)
    expect(screen.getByDisplayValue('Test Garden')).toBeInTheDocument()
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
    const nameInput = screen.getByDisplayValue('Test Garden')
    await user.clear(nameInput)
    await user.type(nameInput, 'Rose Garden')
    expect(useGardenStore.getState().garden.name).toBe('Rose Garden')
  })

  it('updates the store when width is edited', () => {
    render(<Header />)
    const widthInput = screen.getByDisplayValue('20')
    fireEvent.change(widthInput, { target: { value: '50' } })
    expect(useGardenStore.getState().garden.widthMeters).toBe(50)
  })

  it('updates the store when height is edited', () => {
    render(<Header />)
    const heightInput = screen.getByDisplayValue('30')
    fireEvent.change(heightInput, { target: { value: '40' } })
    expect(useGardenStore.getState().garden.heightMeters).toBe(40)
  })

  it('ignores out-of-range values for width', () => {
    render(<Header />)
    const widthInput = screen.getByDisplayValue('20')
    fireEvent.change(widthInput, { target: { value: '200' } })
    expect(useGardenStore.getState().garden.widthMeters).toBe(20)
  })
})
