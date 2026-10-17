import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GardenItemShape } from './GardenItemShape'
import type { GardenItem, CatalogItem } from '@/types/garden'

vi.mock('react-konva', () => ({
  Group: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode
    onClick?: (e: unknown) => void
  }) => (
    <div
      data-testid="shape-group"
      onClick={() => onClick?.({ cancelBubble: false })}
    >
      {children}
    </div>
  ),
  Rect: ({
    fill,
    width,
    height,
    stroke,
    'data-testid': testId,
  }: {
    fill?: string
    width?: number
    height?: number
    stroke?: string
    'data-testid'?: string
  }) => (
    <div
      data-testid={testId ?? 'shape-rect'}
      data-fill={fill}
      data-width={width}
      data-height={height}
      data-stroke={stroke}
    />
  ),
  Circle: ({ fill, radius }: { fill: string; radius: number }) => (
    <div data-testid="shape-circle" data-fill={fill} data-radius={radius} />
  ),
  Text: ({ text }: { text: string }) => (
    <div data-testid="shape-text">{text}</div>
  ),
}))

vi.mock('./Grid', () => ({
  PIXELS_PER_METER: 60,
}))

const baseItem: GardenItem = {
  id: 'item-1',
  catalogId: 'tree-apple',
  xMeters: 2,
  yMeters: 3,
  widthMeters: 4,
  heightMeters: 4,
  rotationDeg: 0,
}

const circleCatalog: CatalogItem = {
  catalogId: 'tree-apple',
  name: 'Apple Tree',
  description: 'Deciduous fruit tree.',
  layer: 5,
  defaultWidthMeters: 4,
  defaultHeightMeters: 4,
  shape: 'circle',
  color: '#2D5A27',
  estimatedCostEur: 35,
}

const rectCatalog: CatalogItem = {
  catalogId: 'raised-bed',
  name: 'Raised Bed',
  description: 'Timber-framed bed.',
  layer: 3,
  defaultWidthMeters: 1.2,
  defaultHeightMeters: 2.4,
  shape: 'rect',
  color: '#4A9E6B',
  estimatedCostEur: 45,
}

const noop = (): void => {}

describe('GardenItemShape', () => {
  it('renders a Circle for circle-shape catalog items', () => {
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('shape-circle')).toBeInTheDocument()
    expect(screen.queryByTestId('shape-rect')).not.toBeInTheDocument()
  })

  it('renders the catalog color on the circle', () => {
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('shape-circle')).toHaveAttribute('data-fill', '#2D5A27')
  })

  it('renders a Rect for rect-shape catalog items', () => {
    const rectItem = { ...baseItem, catalogId: 'raised-bed', widthMeters: 1.2, heightMeters: 2.4 }
    render(
      <GardenItemShape
        item={rectItem}
        catalogItem={rectCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('shape-rect')).toBeInTheDocument()
    expect(screen.queryByTestId('shape-circle')).not.toBeInTheDocument()
  })

  it('renders the catalog color on the rect', () => {
    const rectItem = { ...baseItem, catalogId: 'raised-bed', widthMeters: 1.2, heightMeters: 2.4 }
    render(
      <GardenItemShape
        item={rectItem}
        catalogItem={rectCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('shape-rect')).toHaveAttribute('data-fill', '#4A9E6B')
  })

  it('renders the item name as a label', () => {
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('shape-text')).toHaveTextContent('Apple Tree')
  })

  it('shows selection border when isSelected is true', () => {
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={true}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.getByTestId('selection-border')).toBeInTheDocument()
  })

  it('hides selection border when isSelected is false', () => {
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={false}
        onSelect={noop}
        onMoveEnd={noop}
      />
    )
    expect(screen.queryByTestId('selection-border')).not.toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(
      <GardenItemShape
        item={baseItem}
        catalogItem={circleCatalog}
        isSelected={false}
        onSelect={onSelect}
        onMoveEnd={noop}
      />
    )
    fireEvent.click(screen.getByTestId('shape-group'))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
