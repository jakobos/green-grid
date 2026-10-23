import Konva from 'konva'
import type { CatalogItem, Garden, GardenItem } from '@/types/garden'
import { LAYER_NAMES } from '@/data/catalog'

import { PIXELS_PER_METER } from '@/components/Grid'

export const EXPORT_PIXEL_RATIO = 2.5
export const EXPORT_LABEL_MARGIN = 40
export const EXPORT_TITLE_HEIGHT = 70
export const EXPORT_LEGEND_WIDTH = 240

const PAGE_PADDING = 24
const LEGEND_ROW_HEIGHT = 22
const LEGEND_HEADING_HEIGHT = 30
const LEGEND_TITLE_HEIGHT = 36
const FONT = 'sans-serif'
const INK = '#111827'
const MUTED = '#6b7280'

type LegendGroup = { layer: number; entries: CatalogItem[] }

export function buildLegendGroups(garden: Garden, catalog: CatalogItem[]): LegendGroup[] {
  const placedIds = new Set(garden.items.map((item) => item.catalogId))
  const byLayer = new Map<number, CatalogItem[]>()
  for (const entry of catalog) {
    if (!placedIds.has(entry.catalogId)) continue
    byLayer.set(entry.layer, [...(byLayer.get(entry.layer) ?? []), entry])
  }
  return [...byLayer.entries()]
    .sort(([a], [b]) => a - b)
    .map(([layer, entries]) => ({ layer, entries }))
}

function legendHeight(groups: LegendGroup[]): number {
  if (groups.length === 0) return 0
  return (
    LEGEND_TITLE_HEIGHT +
    groups.reduce((sum, g) => sum + LEGEND_HEADING_HEIGHT + g.entries.length * LEGEND_ROW_HEIGHT, 0)
  )
}

function drawGrid(layer: Konva.Layer, widthMeters: number, heightMeters: number): void {
  const w = widthMeters * PIXELS_PER_METER
  const h = heightMeters * PIXELS_PER_METER
  for (let col = 0; col <= widthMeters; col++) {
    const x = col * PIXELS_PER_METER
    layer.add(new Konva.Line({ points: [x, 0, x, h], stroke: '#d1d5db', strokeWidth: 1 }))
  }
  for (let row = 0; row <= heightMeters; row++) {
    const y = row * PIXELS_PER_METER
    layer.add(new Konva.Line({ points: [0, y, w, y], stroke: '#d1d5db', strokeWidth: 1 }))
  }
  layer.add(new Konva.Rect({ x: 0, y: 0, width: w, height: h, stroke: '#374151', strokeWidth: 2 }))
}

function drawDimensionLabels(layer: Konva.Layer, widthMeters: number, heightMeters: number): void {
  // Label every meter for small gardens, thin out for large ones so text stays legible.
  const step = Math.max(widthMeters, heightMeters) > 40 ? 5 : 1
  const labelSize = 40
  for (let col = 0; col <= widthMeters; col += step) {
    layer.add(
      new Konva.Text({
        x: col * PIXELS_PER_METER - labelSize / 2,
        y: -22,
        width: labelSize,
        text: String(col),
        fontSize: 12,
        fontFamily: FONT,
        fill: MUTED,
        align: 'center',
      })
    )
  }
  for (let row = 0; row <= heightMeters; row += step) {
    layer.add(
      new Konva.Text({
        x: -labelSize - 6,
        y: row * PIXELS_PER_METER - 6,
        width: labelSize,
        text: String(row),
        fontSize: 12,
        fontFamily: FONT,
        fill: MUTED,
        align: 'right',
      })
    )
  }
}

function drawItem(layer: Konva.Layer, item: GardenItem, catalogItem: CatalogItem): void {
  const w = item.widthMeters * PIXELS_PER_METER
  const h = item.heightMeters * PIXELS_PER_METER
  const group = new Konva.Group({
    x: item.xMeters * PIXELS_PER_METER + w / 2,
    y: item.yMeters * PIXELS_PER_METER + h / 2,
    offsetX: w / 2,
    offsetY: h / 2,
    rotation: item.rotationDeg,
    name: 'garden-item',
  })
  if (catalogItem.shape === 'circle') {
    group.add(
      new Konva.Circle({
        x: w / 2,
        y: h / 2,
        radius: Math.min(w, h) / 2,
        fill: catalogItem.color,
        opacity: 0.7,
      })
    )
  } else {
    group.add(
      new Konva.Rect({ width: w, height: h, fill: catalogItem.color, opacity: 0.7, cornerRadius: 3 })
    )
  }
  group.add(
    new Konva.Text({
      y: h / 2 - 6,
      width: w,
      text: catalogItem.name,
      fontSize: 11,
      fontFamily: FONT,
      fill: '#fff',
      align: 'center',
    })
  )
  layer.add(group)
}

function drawCompass(layer: Konva.Layer, x: number, y: number): void {
  layer.add(
    new Konva.Text({ x: x - 10, y, width: 20, text: 'N', fontSize: 18, fontStyle: 'bold', fontFamily: FONT, fill: INK, align: 'center' }),
    new Konva.Arrow({
      points: [x, y + 56, x, y + 26],
      stroke: INK,
      fill: INK,
      strokeWidth: 3,
      pointerLength: 10,
      pointerWidth: 12,
    })
  )
}

function drawLegend(layer: Konva.Layer, groups: LegendGroup[], x: number, y: number): void {
  if (groups.length === 0) return
  layer.add(
    new Konva.Text({ x, y, text: 'Legend', fontSize: 16, fontStyle: 'bold', fontFamily: FONT, fill: INK })
  )
  let cursor = y + LEGEND_TITLE_HEIGHT
  for (const group of groups) {
    layer.add(
      new Konva.Text({
        x,
        y: cursor,
        text: `Layer ${group.layer} — ${LAYER_NAMES[group.layer] ?? ''}`,
        fontSize: 12,
        fontStyle: 'bold',
        fontFamily: FONT,
        fill: MUTED,
      })
    )
    cursor += LEGEND_HEADING_HEIGHT
    for (const entry of group.entries) {
      layer.add(
        new Konva.Rect({ x, y: cursor, width: 14, height: 14, fill: entry.color, opacity: 0.7, name: 'legend-swatch' }),
        new Konva.Text({ x: x + 22, y: cursor, text: entry.name, fontSize: 13, fontFamily: FONT, fill: INK, name: 'legend-label' })
      )
      cursor += LEGEND_ROW_HEIGHT
    }
  }
}

export function renderExportStage(garden: Garden, catalog: CatalogItem[]): Konva.Stage {
  const gardenWidthPx = garden.widthMeters * PIXELS_PER_METER
  const gardenHeightPx = garden.heightMeters * PIXELS_PER_METER
  const groups = buildLegendGroups(garden, catalog)

  const originX = PAGE_PADDING + EXPORT_LABEL_MARGIN
  const originY = PAGE_PADDING + EXPORT_TITLE_HEIGHT
  const legendX = originX + gardenWidthPx + PAGE_PADDING
  const width = groups.length > 0 ? legendX + EXPORT_LEGEND_WIDTH + PAGE_PADDING : originX + gardenWidthPx + PAGE_PADDING + 40
  const height = Math.max(originY + gardenHeightPx, originY + legendHeight(groups)) + PAGE_PADDING

  const stage = new Konva.Stage({ container: document.createElement('div'), width, height })
  const content = new Konva.Layer()
  stage.add(content)

  content.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: '#ffffff', name: 'background' }))

  content.add(
    new Konva.Text({
      x: originX,
      y: PAGE_PADDING,
      width: gardenWidthPx,
      text: garden.name,
      fontSize: 28,
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      align: 'center',
      name: 'title',
    }),
    new Konva.Text({
      x: originX,
      y: PAGE_PADDING + 36,
      width: gardenWidthPx,
      text: `${garden.widthMeters} m × ${garden.heightMeters} m`,
      fontSize: 14,
      fontFamily: FONT,
      fill: MUTED,
      align: 'center',
      name: 'dimensions',
    })
  )
  drawCompass(content, width - PAGE_PADDING - 20, PAGE_PADDING)

  const gardenLayer = new Konva.Layer({ x: originX, y: originY })
  stage.add(gardenLayer)
  drawGrid(gardenLayer, garden.widthMeters, garden.heightMeters)
  drawDimensionLabels(gardenLayer, garden.widthMeters, garden.heightMeters)

  const catalogById = new Map(catalog.map((c) => [c.catalogId, c]))
  const placed = garden.items
    .map((item) => ({ item, catalogItem: catalogById.get(item.catalogId) }))
    .filter((p): p is { item: GardenItem; catalogItem: CatalogItem } => p.catalogItem !== undefined)
    .sort((a, b) => a.catalogItem.layer - b.catalogItem.layer)
  for (const { item, catalogItem } of placed) drawItem(gardenLayer, item, catalogItem)

  drawLegend(content, groups, legendX, originY)

  stage.draw()
  return stage
}
