import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type Konva from 'konva'
import { CATALOG } from '@/data/catalog'
import type { Garden, GardenItem } from '@/types/garden'
import {
  renderExportStage,
  buildLegendGroups,
  EXPORT_LABEL_MARGIN,
  EXPORT_LEGEND_WIDTH,
} from './renderExportStage'

// jsdom has no canvas implementation; give Konva a no-op 2D context.
function createFakeContext(): CanvasRenderingContext2D {
  const state: Record<string | symbol, unknown> = {
    measureText: (text: string) => ({ width: text.length * 7 }),
  }
  return new Proxy(state, {
    get: (target, prop) => (prop in target ? target[prop] : () => undefined),
    set: (target, prop, value) => {
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    createFakeContext as unknown as HTMLCanvasElement['getContext']
  )
})

afterAll(() => {
  vi.restoreAllMocks()
})

const baseGarden: Garden = {
  id: 'g1',
  name: 'Back Yard',
  widthMeters: 10,
  heightMeters: 8,
  items: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

function item(id: string, catalogId: string): GardenItem {
  return { id, catalogId, xMeters: 1, yMeters: 1, widthMeters: 1, heightMeters: 1, rotationDeg: 90 }
}

function texts(stage: Konva.Stage): string[] {
  return stage.find<Konva.Text>('Text').map((t) => t.text())
}

describe('renderExportStage', () => {
  it('sizes the stage to fit the garden plus chrome', () => {
    const stage = renderExportStage(baseGarden, CATALOG)
    expect(stage.width()).toBeGreaterThan(10 * 60 + EXPORT_LABEL_MARGIN)
    expect(stage.height()).toBeGreaterThan(8 * 60)
    stage.destroy()
  })

  it('exports an empty garden with grid, title, compass, dimensions and no legend', () => {
    const stage = renderExportStage(baseGarden, CATALOG)
    const all = texts(stage)
    expect(all).toContain('Back Yard')
    expect(all).toContain('N')
    expect(all).toContain('10 m × 8 m')
    expect(all).not.toContain('Legend')
    expect(stage.find('.legend-swatch')).toHaveLength(0)
    // 11 vertical + 9 horizontal grid lines
    expect(stage.find('Line')).toHaveLength(11 + 9)
    stage.destroy()
  })

  it('labels meters along the top and left edges', () => {
    const stage = renderExportStage(baseGarden, CATALOG)
    const all = texts(stage)
    expect(all.filter((t) => t === '0')).toHaveLength(2)
    expect(all).toContain('10')
    expect(all).toContain('8')
    stage.destroy()
  })

  it('lists each placed catalog item once in the legend, grouped by layer', () => {
    const [a, b] = [CATALOG.find((c) => c.layer === 5)!, CATALOG.find((c) => c.layer === 1)!]
    const garden = {
      ...baseGarden,
      items: [item('1', a.catalogId), item('2', a.catalogId), item('3', b.catalogId)],
    }
    const stage = renderExportStage(garden, CATALOG)
    const labels = stage.find<Konva.Text>('.legend-label').map((t) => t.text())
    expect(labels).toEqual([b.name, a.name])
    expect(stage.find('.legend-swatch')).toHaveLength(2)
    expect(texts(stage)).toContain('Legend')
    expect(stage.width()).toBeGreaterThanOrEqual(10 * 60 + EXPORT_LEGEND_WIDTH)
    stage.destroy()
  })

  it('draws every placed item with its rotation, ordered by layer', () => {
    const tree = CATALOG.find((c) => c.layer === 5)!
    const bulb = CATALOG.find((c) => c.layer === 1)!
    const garden = { ...baseGarden, items: [item('1', tree.catalogId), item('2', bulb.catalogId)] }
    const stage = renderExportStage(garden, CATALOG)
    const groups = stage.find<Konva.Group>('.garden-item')
    expect(groups).toHaveLength(2)
    expect(groups.every((g) => g.rotation() === 90)).toBe(true)
    expect(groups[0].findOne<Konva.Text>('Text')!.text()).toBe(bulb.name)
    stage.destroy()
  })
})

describe('buildLegendGroups', () => {
  it('ignores items whose catalog entry is unknown', () => {
    const garden = { ...baseGarden, items: [item('1', 'nope')] }
    expect(buildLegendGroups(garden, CATALOG)).toEqual([])
  })
})
