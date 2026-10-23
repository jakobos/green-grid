import Konva from 'konva'
import rough from 'roughjs'
import type { Drawable } from 'roughjs/bin/core'
import type { RoughGenerator } from 'roughjs/bin/generator'
import type { CatalogItem, Garden, GardenItem } from '@/types/garden'
import { LAYER_NAMES } from '@/data/catalog'
import { PIXELS_PER_METER } from '@/components/Grid'
import { seedHash } from './seedHash'
import { PAPER, INK, INK_MUTED, GRID_STROKE, BOUNDARY_STROKE } from './exportPalette'

export const EXPORT_PIXEL_RATIO = 2.5
export const EXPORT_LABEL_MARGIN = 40
export const EXPORT_TITLE_HEIGHT = 100
export const EXPORT_LEGEND_WIDTH = 240

const PAGE_PADDING = 24
const LEGEND_ROW_HEIGHT = 22
const LEGEND_HEADING_HEIGHT = 22
const LEGEND_GROUP_GAP = 16
const LEGEND_TITLE_HEIGHT = 36
const FONT = 'sans-serif'

type LegendGroup = { layer: number; entries: CatalogItem[] }

/**
 * Build the roughjs Drawable for one item's body.
 * Exported so tests can verify determinism (same seed → identical sets)
 * without touching canvas.  Never calls Math.random.
 */
export function buildItemDrawable(
  gen: RoughGenerator,
  shape: 'rect' | 'circle',
  wPx: number,
  hPx: number,
  color: string,
  seed: number
): Drawable {
  const opts = {
    seed,
    roughness: 1.2,
    stroke: INK,
    strokeWidth: 1.5,
    fill: color,
    fillStyle: 'hachure' as const,
    hachureGap: 8,
  }
  return shape === 'circle'
    ? gen.ellipse(wPx / 2, hPx / 2, Math.min(wPx, hPx), Math.min(wPx, hPx), opts)
    : gen.rectangle(0, 0, wPx, hPx, opts)
}

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
    groups.reduce(
      (sum, g) => sum + LEGEND_HEADING_HEIGHT + g.entries.length * LEGEND_ROW_HEIGHT + LEGEND_GROUP_GAP,
      0
    )
  )
}

/**
 * Draw rough grid lines and a stronger rough boundary for the garden area.
 * All seeds are derived from gardenId + position so the same garden always
 * produces the same strokes; no Math.random is used.
 */
function drawGrid(
  layer: Konva.Layer,
  gardenId: string,
  widthMeters: number,
  heightMeters: number
): void {
  const gen = rough.generator()
  const w = widthMeters * PIXELS_PER_METER
  const h = heightMeters * PIXELS_PER_METER

  const gridDrawables: Drawable[] = []
  for (let col = 0; col <= widthMeters; col++) {
    const x = col * PIXELS_PER_METER
    gridDrawables.push(
      gen.line(x, 0, x, h, {
        seed: seedHash(`${gardenId}:gv:${col}`),
        roughness: 0.4,
        strokeWidth: 0.5,
        stroke: GRID_STROKE,
      })
    )
  }
  for (let row = 0; row <= heightMeters; row++) {
    const y = row * PIXELS_PER_METER
    gridDrawables.push(
      gen.line(0, y, w, y, {
        seed: seedHash(`${gardenId}:gh:${row}`),
        roughness: 0.4,
        strokeWidth: 0.5,
        stroke: GRID_STROKE,
      })
    )
  }

  const boundaryDrawable = gen.rectangle(0, 0, w, h, {
    seed: seedHash(`${gardenId}:boundary`),
    roughness: 1.0,
    strokeWidth: 2,
    stroke: BOUNDARY_STROKE,
  })

  layer.add(
    new Konva.Shape({
      name: 'grid-lines',
      listening: false,
      width: w,
      height: h,
      sceneFunc(ctx) {
        // rough.canvas needs the raw HTMLCanvasElement; ctx.canvas is Konva's
        // wrapper, so we reach through to _canvas which holds the real element.
        const rc = rough.canvas(ctx.canvas._canvas)
        for (const d of gridDrawables) rc.draw(d)
        rc.draw(boundaryDrawable)
      },
    })
  )
}

function drawDimensionLabels(
  layer: Konva.Layer,
  widthMeters: number,
  heightMeters: number
): void {
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
        fill: INK_MUTED,
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
        fill: INK_MUTED,
        align: 'right',
      })
    )
  }
}

/**
 * Draw one placed garden item as a rough hachure-filled shape.
 * The seed comes from item.id; different items always produce different strokes;
 * the same item always produces the same strokes.
 */
function drawItem(layer: Konva.Layer, item: GardenItem, catalogItem: CatalogItem): void {
  const w = item.widthMeters * PIXELS_PER_METER
  const h = item.heightMeters * PIXELS_PER_METER
  const gen = rough.generator()
  const drawable = buildItemDrawable(gen, catalogItem.shape, w, h, catalogItem.color, seedHash(item.id))

  const group = new Konva.Group({
    x: item.xMeters * PIXELS_PER_METER + w / 2,
    y: item.yMeters * PIXELS_PER_METER + h / 2,
    offsetX: w / 2,
    offsetY: h / 2,
    rotation: item.rotationDeg,
    name: 'garden-item',
  })

  group.add(
    new Konva.Shape({
      width: w,
      height: h,
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        rc.draw(drawable)
      },
    })
  )

  group.add(
    new Konva.Text({
      y: h / 2 - 6,
      width: w,
      text: catalogItem.name,
      fontSize: 11,
      fontFamily: FONT,
      fill: INK,
      align: 'center',
    })
  )

  layer.add(group)
}

/**
 * Draw a hand-drawn north compass: rough arrow shaft + solid triangle head,
 * seeded from gardenId.  The "N" label is a plain Konva.Text for legibility.
 */
function drawCompass(layer: Konva.Layer, x: number, y: number, gardenId: string): void {
  const gen = rough.generator()
  const seed = seedHash(`${gardenId}:compass`)

  const shaft = gen.line(0, 56, 0, 30, {
    seed,
    roughness: 0.8,
    strokeWidth: 2,
    stroke: INK,
  })
  const head = gen.polygon(
    [
      [0, 20],
      [-7, 32],
      [7, 32],
    ],
    {
      seed: seed + 1,
      roughness: 0.8,
      stroke: INK,
      fill: INK,
      fillStyle: 'solid',
    }
  )

  const group = new Konva.Group({ x, y })
  group.add(
    new Konva.Text({
      x: -10,
      y: 0,
      width: 20,
      text: 'N',
      fontSize: 18,
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      align: 'center',
    }),
    new Konva.Shape({
      name: 'compass',
      width: 20,
      height: 60,
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        rc.draw(shaft)
        rc.draw(head)
      },
    })
  )
  layer.add(group)
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
        fill: INK_MUTED,
      })
    )
    cursor += LEGEND_HEADING_HEIGHT
    for (const entry of group.entries) {
      layer.add(
        new Konva.Rect({
          x,
          y: cursor,
          width: 14,
          height: 14,
          fill: entry.color,
          opacity: 0.7,
          name: 'legend-swatch',
        }),
        new Konva.Text({
          x: x + 22,
          y: cursor,
          text: entry.name,
          fontSize: 13,
          fontFamily: FONT,
          fill: INK,
          name: 'legend-label',
        })
      )
      cursor += LEGEND_ROW_HEIGHT
    }
    cursor += LEGEND_GROUP_GAP
  }
}

export function renderExportStage(garden: Garden, catalog: CatalogItem[]): Konva.Stage {
  const gardenWidthPx = garden.widthMeters * PIXELS_PER_METER
  const gardenHeightPx = garden.heightMeters * PIXELS_PER_METER
  const groups = buildLegendGroups(garden, catalog)

  const originX = PAGE_PADDING + EXPORT_LABEL_MARGIN
  const originY = PAGE_PADDING + EXPORT_TITLE_HEIGHT
  const legendX = originX + gardenWidthPx + PAGE_PADDING
  const width =
    groups.length > 0
      ? legendX + EXPORT_LEGEND_WIDTH + PAGE_PADDING
      : originX + gardenWidthPx + PAGE_PADDING + 40
  const height =
    Math.max(originY + gardenHeightPx, originY + legendHeight(groups)) + PAGE_PADDING

  const stage = new Konva.Stage({ container: document.createElement('div'), width, height })
  const content = new Konva.Layer()
  stage.add(content)

  // Paper background — warm tone, not white
  content.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: PAPER, name: 'background' }))

  // Title and dimensions remain plain Konva.Text for legibility
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
      fill: INK_MUTED,
      align: 'center',
      name: 'dimensions',
    })
  )
  drawCompass(content, width - PAGE_PADDING - 20, PAGE_PADDING, garden.id)

  const gardenLayer = new Konva.Layer({ x: originX, y: originY })
  stage.add(gardenLayer)
  drawGrid(gardenLayer, garden.id, garden.widthMeters, garden.heightMeters)
  drawDimensionLabels(gardenLayer, garden.widthMeters, garden.heightMeters)

  const catalogById = new Map(catalog.map((c) => [c.catalogId, c]))
  const placed = garden.items
    .map((item) => ({ item, catalogItem: catalogById.get(item.catalogId) }))
    .filter(
      (p): p is { item: GardenItem; catalogItem: CatalogItem } => p.catalogItem !== undefined
    )
    .sort((a, b) => a.catalogItem.layer - b.catalogItem.layer)
  for (const { item, catalogItem } of placed) drawItem(gardenLayer, item, catalogItem)

  drawLegend(content, groups, legendX, originY)

  stage.draw()
  return stage
}
