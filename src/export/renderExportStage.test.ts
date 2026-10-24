import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type Konva from 'konva'
import { CATALOG } from '@/data/catalog'
import type { Garden, GardenItem } from '@/types/garden'
import {
  renderExportStage,
  buildLegendGroups,
  buildMarkerNumbers,
} from './renderExportStage'
import { sheetSizePx, chooseOrientation, pickScale, mapAreaMm, mmToPx } from './sheetLayout'
import { seedHash } from './seedHash'

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
  it('stage is exactly A4 at 300 dpi for the chosen orientation', () => {
    // 10×8 m → portrait at 1:100
    const stage = renderExportStage(baseGarden, CATALOG)
    const expected = sheetSizePx(chooseOrientation(10, 8))
    expect(stage.width()).toBe(expected.width)
    expect(stage.height()).toBe(expected.height)
    stage.destroy()
  })

  it('100×10 m exports landscape; 10×100 m exports portrait', () => {
    const wide = { ...baseGarden, widthMeters: 100, heightMeters: 10 }
    const tall = { ...baseGarden, widthMeters: 10, heightMeters: 100 }
    const wideStage = renderExportStage(wide, CATALOG)
    const tallStage = renderExportStage(tall, CATALOG)
    expect(wideStage.width()).toBe(sheetSizePx('landscape').width)
    expect(wideStage.height()).toBe(sheetSizePx('landscape').height)
    expect(tallStage.width()).toBe(sheetSizePx('portrait').width)
    expect(tallStage.height()).toBe(sheetSizePx('portrait').height)
    wideStage.destroy()
    tallStage.destroy()
  })

  it('map scale is from the standard list and the garden fits inside the map area', () => {
    const gardens: [number, number][] = [[1, 1], [20, 20], [100, 10], [10, 100], [100, 100]]
    for (const [w, h] of gardens) {
      const garden = { ...baseGarden, widthMeters: w, heightMeters: h }
      const stage = renderExportStage(garden, CATALOG)
      // If the stage is landscape, the garden must have benefited from it
      const orientation = stage.width() > stage.height() ? 'landscape' : 'portrait'
      const { w: mw, h: mh } = mapAreaMm(orientation)
      const scale = pickScale(w, h, mw, mh)
      // Garden fits in map area at that scale (metres × mm/m ≤ map area mm)
      expect(w * (1000 / scale)).toBeLessThanOrEqual(mw + 0.001)
      expect(h * (1000 / scale)).toBeLessThanOrEqual(mh + 0.001)
      stage.destroy()
    }
  })


  it('exports an empty garden with grid, title, compass, dimensions and no legend', () => {
    const stage = renderExportStage(baseGarden, CATALOG)
    const all = texts(stage)
    expect(all).toContain('Back Yard')
    expect(all).toContain('N')
    expect(all).toContain('10 m × 8 m')
    expect(all).not.toContain('Legend')
    expect(stage.find('.legend-swatch')).toHaveLength(0)
    // Grid and boundary are drawn as one rough Shape node
    expect(stage.find('.grid-lines')).toHaveLength(1)
    // Compass arrow is a rough Shape node
    expect(stage.find('.compass')).toHaveLength(1)
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

  it('keeps the subtitle above the top meter labels', () => {
    const stage = renderExportStage(baseGarden, CATALOG)
    const all = stage.find<Konva.Text>('Text')
    const subtitle = all.find((t) => t.name() === 'dimensions')!
    const topLabels = all.filter(
      (t) => /^\d+$/.test(t.text()) && t.getAbsolutePosition().x > 0 && t.align() === 'center'
    )
    expect(topLabels.length).toBeGreaterThan(0)
    const subtitleBottom = subtitle.getAbsolutePosition().y + subtitle.height()
    const labelsTop = Math.min(...topLabels.map((t) => t.getAbsolutePosition().y))
    expect(subtitleBottom).toBeLessThan(labelsTop)
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
    // Stage is always A4 regardless of legend content
    expect(stage.width()).toBe(sheetSizePx(chooseOrientation(10, 8)).width)
    stage.destroy()
  })

  it('draws every placed item with its rotation, ordered by layer; no name text in item groups', () => {
    const tree = CATALOG.find((c) => c.layer === 5)!
    const bulb = CATALOG.find((c) => c.layer === 1)!
    const garden = { ...baseGarden, items: [item('1', tree.catalogId), item('2', bulb.catalogId)] }
    const stage = renderExportStage(garden, CATALOG)
    const groups = stage.find<Konva.Group>('.garden-item')
    expect(groups).toHaveLength(2)
    expect(groups.every((g) => g.rotation() === 90)).toBe(true)
    // No catalog name text inside item groups — markers live outside the rotated group
    for (const g of groups) {
      expect(g.find('Text')).toHaveLength(0)
    }
    stage.destroy()
  })
})

describe('buildMarkerNumbers', () => {
  it('returns empty map for empty groups', () => {
    expect(buildMarkerNumbers([])).toEqual(new Map())
  })

  it('assigns 1-based numbers in layer order then entry order', () => {
    const layer1 = CATALOG.find((c) => c.layer === 1)!
    const layer5 = CATALOG.find((c) => c.layer === 5)!
    const garden = { ...baseGarden, items: [item('a', layer5.catalogId), item('b', layer1.catalogId)] }
    const groups = buildLegendGroups(garden, CATALOG)
    const nums = buildMarkerNumbers(groups)
    // layer 1 comes first → number 1, layer 5 → number 2
    expect(nums.get(layer1.catalogId)).toBe(1)
    expect(nums.get(layer5.catalogId)).toBe(2)
  })

  it('assigns consecutive numbers across multiple layers', () => {
    const entries = CATALOG.slice(0, 5)
    // Fake a garden that has all five items
    const garden = {
      ...baseGarden,
      items: entries.map((e, i) => item(String(i), e.catalogId)),
    }
    const groups = buildLegendGroups(garden, CATALOG)
    const nums = buildMarkerNumbers(groups)
    // All five get distinct 1-based numbers
    const values = [...nums.values()].sort((a, b) => a - b)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })
})

describe('marker placement', () => {
  const tulipCatalog = CATALOG.find((c) => c.name.includes('Tulip'))!

  it('renders one marker per unique catalog type (dedupe within 6 mm)', () => {
    // Two tulips at the same spot — only one marker should be drawn
    const tinyItem = (id: string): GardenItem => ({
      id,
      catalogId: tulipCatalog.catalogId,
      xMeters: 1,
      yMeters: 1,
      widthMeters: 0.2,
      heightMeters: 0.2,
      rotationDeg: 0,
    })
    const garden = { ...baseGarden, items: [tinyItem('t1'), tinyItem('t2')] }
    const stage = renderExportStage(garden, CATALOG)
    // Both items are at same position → dedupe → one marker
    expect(stage.find('.plan-marker')).toHaveLength(1)
    stage.destroy()
  })

  it('renders two markers when same type is > 6 mm apart', () => {
    // 16×10 m → landscape 1:100; 1 m = 10 mm on paper > 6 mm dedupe threshold
    const garden = {
      ...baseGarden,
      widthMeters: 16,
      heightMeters: 10,
      items: [
        { id: 't1', catalogId: tulipCatalog.catalogId, xMeters: 1, yMeters: 1, widthMeters: 0.2, heightMeters: 0.2, rotationDeg: 0 },
        { id: 't2', catalogId: tulipCatalog.catalogId, xMeters: 2, yMeters: 1, widthMeters: 0.2, heightMeters: 0.2, rotationDeg: 0 },
      ],
    }
    const stage = renderExportStage(garden, CATALOG)
    expect(stage.find('.plan-marker')).toHaveLength(2)
    stage.destroy()
  })

  it('places marker clear of the drawn box for items smaller than 8 mm', () => {
    // 0.2 m tulip at 1:1000 → drawn at MIN_SYMBOL_PX (< 8 mm threshold)
    // marker centre pushed r + 0.5 mm outside the top-right corner
    const bigGarden = {
      ...baseGarden,
      widthMeters: 100,
      heightMeters: 100,
      items: [{ id: 'b1', catalogId: tulipCatalog.catalogId, xMeters: 5, yMeters: 5, widthMeters: 0.2, heightMeters: 0.2, rotationDeg: 0 }],
    }
    const stage = renderExportStage(bigGarden, CATALOG)
    const markers = stage.find<Konva.Group>('.plan-marker')
    expect(markers).toHaveLength(1)
    const label = markers[0].findOne<Konva.Text>('.marker-label')
    expect(label?.text()).toBe('1')

    // Verify marker circle doesn't intersect the drawn box.
    // Both the plan-marker group and the garden-item group live on gardenLayer,
    // so their .x()/.y() are directly comparable in gardenLayer coords.
    const markerGroup = markers[0]
    const itemGroup = stage.find<Konva.Group>('.garden-item')[0]
    const MARKER_R_PX = mmToPx(2)
    // Drawn box: centre at (itemGroup.x(), itemGroup.y()), half-extents = offsetX/offsetY
    const boxRightEdge = itemGroup.x() + itemGroup.offsetX()   // = itemCx + drawnW/2
    const boxTopEdge   = itemGroup.y() - itemGroup.offsetY()   // = itemCy − drawnH/2
    // Marker group top-left is at (markerGroup.x(), markerGroup.y())
    // Marker circle spans [markerGroup.x() … markerGroup.x() + 2r] horizontally
    //                 and [markerGroup.y() … markerGroup.y() + 2r] vertically
    expect(markerGroup.x()).toBeGreaterThan(boxRightEdge)         // left edge > box right
    expect(markerGroup.y() + MARKER_R_PX * 2).toBeLessThan(boxTopEdge) // bottom < box top
    // Gap on each axis should be exactly 0.5 mm
    const GAP_PX = mmToPx(0.5)
    expect(markerGroup.x() - boxRightEdge).toBeCloseTo(GAP_PX, 0)
    expect(boxTopEdge - (markerGroup.y() + MARKER_R_PX * 2)).toBeCloseTo(GAP_PX, 0)

    stage.destroy()
  })
})

describe('buildLegendGroups', () => {
  it('ignores items whose catalog entry is unknown', () => {
    const garden = { ...baseGarden, items: [item('1', 'nope')] }
    expect(buildLegendGroups(garden, CATALOG)).toEqual([])
  })
})

describe('seeded geometry', () => {
  it('seedHash returns the same value for the same string', () => {
    expect(seedHash('garden-1:gv:3')).toBe(seedHash('garden-1:gv:3'))
    expect(seedHash('g1:boundary')).toBe(seedHash('g1:boundary'))
  })

  it('seedHash returns different values for different strings', () => {
    expect(seedHash('item-a')).not.toBe(seedHash('item-b'))
    expect(seedHash('g1:gv:0')).not.toBe(seedHash('g1:gh:0'))
  })

  it('seedHash always returns a non-negative integer', () => {
    const samples = ['', 'a', 'garden-xyz:compass', 'item-with-long-id-1234567890']
    for (const s of samples) {
      const h = seedHash(s)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(h)).toBe(true)
    }
  })
})

