import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import { LAYER_NAMES } from '@/data/catalog'

describe('Sidebar', () => {
  it('renders all 5 layer headings when expanded', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
    for (const name of Object.values(LAYER_NAMES)) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders catalog items with drag handles', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
    // Apple Tree is a known catalog entry in layer 5
    const appleTree = screen.getByText('Apple Tree')
    expect(appleTree).toBeInTheDocument()
    const listItem = appleTree.closest('li')
    expect(listItem).toHaveAttribute('draggable', 'true')
  })

  it('sets data-catalog-id on draggable items', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
    const appleTree = screen.getByText('Apple Tree').closest('li')
    expect(appleTree).toHaveAttribute('data-catalog-id', 'tree-apple')
  })

  it('sets correct drag data on dragstart', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
    const appleTree = screen.getByText('Apple Tree').closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(appleTree, { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/x-catalog-id',
      'tree-apple'
    )
  })

  it('collapses layer section when heading button is clicked', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
    const treesHeading = screen.getByText('Trees').closest('button')!
    // Apple Tree visible initially
    expect(screen.getByText('Apple Tree')).toBeInTheDocument()
    fireEvent.click(treesHeading)
    // Apple Tree hidden after collapse
    expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
  })

  it('calls onToggle when the sidebar toggle button is clicked', () => {
    const onToggle = vi.fn()
    render(<Sidebar collapsed={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('hides catalog when collapsed', () => {
    render(<Sidebar collapsed={true} onToggle={vi.fn()} />)
    expect(screen.queryByTestId('sidebar-catalog')).not.toBeInTheDocument()
  })

  it('shows expand button label when collapsed', () => {
    render(<Sidebar collapsed={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })
})
