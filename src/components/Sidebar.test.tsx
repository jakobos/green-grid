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

  describe('catalog search', () => {
    it('renders a search input when expanded', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      expect(screen.getByTestId('catalog-search')).toBeInTheDocument()
    })

    it('does not render search input when collapsed', () => {
      render(<Sidebar collapsed={true} onToggle={vi.fn()} />)
      expect(screen.queryByTestId('catalog-search')).not.toBeInTheDocument()
    })

    it('filters items by name (case-insensitive): typing "rose" shows Rose Bush', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'rose' } })
      // Rose Bush is in the catalog under layer 4 (Low Plants)
      expect(screen.getByText('Rose Bush')).toBeInTheDocument()
      // Items without "rose" in name or description should be gone
      expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
      expect(screen.queryByText('Tulip Bulb')).not.toBeInTheDocument()
    })

    it('filters items by name case-insensitively: "ROSE" shows Rose Bush', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'ROSE' } })
      expect(screen.getByText('Rose Bush')).toBeInTheDocument()
    })

    it('shows layer heading of matching items but hides layers with no matches', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'rose' } })
      // Rose Bush is under Low Plants (layer 4)
      expect(screen.getByText('Low Plants')).toBeInTheDocument()
      // Trees has no matches
      expect(screen.queryByText('Trees')).not.toBeInTheDocument()
    })

    it('filters by description: typing "pollinators" shows Lavender', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      // Lavender description: "Perennial herb; attracts pollinators."
      fireEvent.change(input, { target: { value: 'pollinators' } })
      expect(screen.getByText('Lavender')).toBeInTheDocument()
      expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
    })

    it('shows no-items message when query matches nothing', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'xyznotfound999' } })
      expect(screen.getByText(/no items match/i)).toBeInTheDocument()
      expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
    })

    it('restores all items when query is cleared', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'xyznotfound999' } })
      expect(screen.getByText(/no items match/i)).toBeInTheDocument()
      fireEvent.change(input, { target: { value: '' } })
      expect(screen.queryByText(/no items match/i)).not.toBeInTheDocument()
      expect(screen.getByText('Apple Tree')).toBeInTheDocument()
    })

    it('pressing Escape clears the query and restores all items', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'rose' } })
      expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.getByText('Apple Tree')).toBeInTheDocument()
    })

    it('shows filtered item even when its layer section is collapsed', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      // Collapse the Trees section
      const treesHeading = screen.getByText('Trees').closest('button')!
      fireEvent.click(treesHeading)
      expect(screen.queryByText('Apple Tree')).not.toBeInTheDocument()
      // Now search for Apple Tree
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'apple' } })
      // Apple Tree should be visible despite collapsed section
      expect(screen.getByText('Apple Tree')).toBeInTheDocument()
    })

    it('filtered item is draggable and sets correct drag data', () => {
      render(<Sidebar collapsed={false} onToggle={vi.fn()} />)
      const input = screen.getByTestId('catalog-search')
      fireEvent.change(input, { target: { value: 'lavender' } })
      const lavender = screen.getByText('Lavender').closest('li')!
      expect(lavender).toHaveAttribute('draggable', 'true')
      const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
      fireEvent.dragStart(lavender, { dataTransfer })
      expect(dataTransfer.setData).toHaveBeenCalledWith(
        'application/x-catalog-id',
        'herb-lavender'
      )
    })
  })
})
