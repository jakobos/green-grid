import Konva from 'konva'
import rough from 'roughjs'
import type { Drawable } from 'roughjs/bin/core'
import type { RoughGenerator } from 'roughjs/bin/generator'
import type { CatalogItem, Garden, GardenItem } from '@/types/garden'
import { LAYER_NAMES } from '@/data/catalog'
import { seedHash } from './seedHash'
import {
  PX_PER_MM,
  mmToPx,
  ptToPx,
  sheetSizePx,
  mapAreaMm,
  pickScale,
  chooseOrientation,
  gridStepMeters,
  scaleBarLengthMeters,
  MARGIN_MM,
  TITLE_H_MM,
  LABEL_SIDE_MM,
  LABEL_TOP_MM,
  LEGEND_W_MM,
} from './sheetLayout'
import { PAPER, INK, INK_MUTED, GRID_STROKE, BOUNDARY_STROKE } from './exportPalette'

// ── Paper-unit stroke widths ───────────────────────────────────────────────────
// All values are in paper pixels (= mm × PX_PER_MM) so they are independent of
// garden size: a 3 m bed and a 100 m plot print with identical line weights.
const GRID_SW = 0.1 * PX_PER_MM       // fine grid lines: 0.1 mm
const BOUNDARY_SW = 0.45 * PX_PER_MM  // garden boundary: 0.45 mm
const ITEM_SW = 0.3 * PX_PER_MM       // item outlines: 0.3 mm
const COMPASS_SW = 0.5 * PX_PER_MM    // compass strokes: 0.5 mm
const SCALE_BAR_SW = 0.45 * PX_PER_MM // scale bar: same weight as boundary
// Hachure line gap: 2 mm in paper pixels
const HACHURE_GAP = 2.0 * PX_PER_MM

const FONT = 'sans-serif'

type LegendGroup = { layer: number; entries: CatalogItem[] }

// ── Exported test seams ────────────────────────────────────────────────────────

/**
 * Build the roughjs Drawable for one item's body.
 * Exported so tests can verify determinism (same seed → identical sets)
 * without touching canvas. Never calls Math.random.
 *
 * wPx / hPx are in paper pixels (item metres × pxPerMeter).
 * Stroke width and hachure gap are fixed paper-unit constants, independent of
 * garden or item size — C010 re-expresses the values C007 tuned at 60 px/m.
 */
export function buildItemDrawable(
  gen: RoughGenerator,
  shape: 'rect' | 'circle',
  wPx: number,
  hPx: number,
  color: string,
  seed: number,
): Drawable {
  const opts = {
    seed,
    roughness: 1.2,
    stroke: INK,
    strokeWidth: ITEM_SW,
    fill: color,
    fillStyle: 'hachure' as const,
    hachureGap: HACHURE_GAP,
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

// ── Drawing helpers ────────────────────────────────────────────────────────────

/**
 * Draw rough grid lines (every `step` metres) and a stronger rough boundary.
 * Seeds: gardenId + metre position → same garden always reproduces the same strokes.
 */
function drawGrid(
  layer: Konva.Layer,
  gardenId: string,
  widthMeters: number,
  heightMeters: number,
  pxPerMeter: number,
  step: number,
): void {
  const gen = rough.generator()
  const w = widthMeters * pxPerMeter
  const h = heightMeters * pxPerMeter

  const gridDrawables: Drawable[] = []
  for (let col = 0; col <= widthMeters; col += step) {
    gridDrawables.push(
      gen.line(col * pxPerMeter, 0, col * pxPerMeter, h, {
        seed: seedHash(`${gardenId}:gv:${col}`),
        roughness: 0.4,
        strokeWidth: GRID_SW,
        stroke: GRID_STROKE,
      }),
    )
  }
  for (let row = 0; row <= heightMeters; row += step) {
    gridDrawables.push(
      gen.line(0, row * pxPerMeter, w, row * pxPerMeter, {
        seed: seedHash(`${gardenId}:gh:${row}`),
        roughness: 0.4,
        strokeWidth: GRID_SW,
        stroke: GRID_STROKE,
      }),
    )
  }

  const boundaryDrawable = gen.rectangle(0, 0, w, h, {
    seed: seedHash(`${gardenId}:boundary`),
    roughness: 1.0,
    strokeWidth: BOUNDARY_SW,
    stroke: BOUNDARY_STROKE,
  })

  layer.add(
    new Konva.Shape({
      name: 'grid-lines',
      listening: false,
      width: w,
      height: h,
      sceneFunc(ctx) {
        // roughjs requires the raw HTMLCanvasElement; ctx.canvas is Konva's
        // wrapper, so reach through _canvas for the real element.
        const rc = rough.canvas(ctx.canvas._canvas)
        for (const d of gridDrawables) rc.draw(d)
        rc.draw(boundaryDrawable)
      },
    }),
  )
}

/**
 * Place numeric metre labels along the top (x-axis) and left (y-axis) edges.
 * Labels are drawn at negative offsets so they land in the gutter reserved by
 * LABEL_SIDE_MM and LABEL_TOP_MM above and to the left of the garden origin.
 */
function drawDimensionLabels(
  layer: Konva.Layer,
  widthMeters: number,
  heightMeters: number,
  pxPerMeter: number,
  step: number,
): void {
  const labelW = mmToPx(10)
  const labelH = mmToPx(4)
  const fontSize = ptToPx(8) // ≥ 8 pt minimum per spec

  for (let col = 0; col <= widthMeters; col += step) {
    layer.add(
      new Konva.Text({
        x: col * pxPerMeter - labelW / 2,
        y: -mmToPx(6),
        width: labelW,
        height: labelH,
        text: String(col),
        fontSize,
        fontFamily: FONT,
        fill: INK_MUTED,
        align: 'center',
      }),
    )
  }
  for (let row = 0; row <= heightMeters; row += step) {
    layer.add(
      new Konva.Text({
        x: -labelW - mmToPx(2),
        y: row * pxPerMeter - labelH / 2,
        width: labelW,
        text: String(row),
        fontSize,
        fontFamily: FONT,
        fill: INK_MUTED,
        align: 'right',
      }),
    )
  }
}

/**
 * Draw one placed garden item as a rough hachure-filled shape.
 * Metre coordinates are converted to paper pixels with pxPerMeter.
 */
function drawItem(
  layer: Konva.Layer,
  item: GardenItem,
  catalogItem: CatalogItem,
  pxPerMeter: number,
): void {
  const w = item.widthMeters * pxPerMeter
  const h = item.heightMeters * pxPerMeter
  const gen = rough.generator()
  const drawable = buildItemDrawable(
    gen,
    catalogItem.shape,
    w,
    h,
    catalogItem.color,
    seedHash(item.id),
  )

  const group = new Konva.Group({
    x: item.xMeters * pxPerMeter + w / 2,
    y: item.yMeters * pxPerMeter + h / 2,
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
    }),
    new Konva.Text({
      y: h / 2 - ptToPx(9) / 2,
      width: w,
      text: catalogItem.name,
      fontSize: ptToPx(9),
      fontFamily: FONT,
      fill: INK,
      align: 'center',
    }),
  )
  layer.add(group)
}

/**
 * Draw the hand-drawn north compass: rough arrow shaft + filled triangle head.
 * The design from C007 is scaled to 14 mm paper height (pxPerMeter-independent).
 * Arrow and "N" label are centred at (x, y); seed from gardenId.
 */
function drawCompass(layer: Konva.Layer, x: number, y: number, gardenId: string): void {
  // Scale old 60px design to 14 mm paper height
  const shapeH = mmToPx(14)
  const s = shapeH / 60
  const halfW = Math.round(7 * s) // arrowhead half-width ≈ 19 px
  const sw = Math.ceil(COMPASS_SW)
  // Shape is at group local x = -(halfW+sw); cx is the x centre in shape-local coords
  const cx = halfW + sw

  const gen = rough.generator()
  const seed = seedHash(`${gardenId}:compass`)
  // All x coords use cx so they resolve to group-local x=0 (centred under "N")
  const shaft = gen.line(cx, Math.round(56 * s), cx, Math.round(30 * s), {
    seed,
    roughness: 0.8,
    strokeWidth: COMPASS_SW,
    stroke: INK,
  })
  const head = gen.polygon(
    [
      [cx, Math.round(20 * s)],
      [cx - halfW, Math.round(32 * s)],
      [cx + halfW, Math.round(32 * s)],
    ],
    {
      seed: seed + 1,
      roughness: 0.8,
      stroke: INK,
      fill: INK,
      fillStyle: 'solid',
    },
  )

  const nSize = ptToPx(10)
  const group = new Konva.Group({ x, y })
  group.add(
    new Konva.Text({
      x: -nSize / 2,
      y: 0,
      width: nSize,
      text: 'N',
      fontSize: nSize,
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      align: 'center',
    }),
    new Konva.Shape({
      name: 'compass',
      x: -(halfW + sw),
      y: 0,
      width: halfW * 2 + sw * 2,
      height: shapeH + sw,
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        rc.draw(shaft)
        rc.draw(head)
      },
    }),
  )
  layer.add(group)
}

/**
 * Draw the scale bar with rough end caps, a metre label, and "1:N" ratio text.
 * Drawn length = scaleBarLengthMeters(scale) * (1000/scale) * PX_PER_MM px;
 * labelled with the same metre count so both agree to within rounding.
 * Uses a fixed seed (independent of garden) for determinism.
 */
function drawScaleBar(layer: Konva.Layer, x: number, y: number, scale: number): void {
  const barMeters = scaleBarLengthMeters(scale)
  const barPx = Math.round(barMeters * (1000 / scale) * PX_PER_MM)
  const tickH = mmToPx(1.5)
  const sw = Math.ceil(SCALE_BAR_SW)

  const gen = rough.generator()
  const seed = seedHash('scale-bar')
  const barLine = gen.line(0, tickH, barPx, tickH, {
    seed,
    roughness: 0.6,
    strokeWidth: SCALE_BAR_SW,
    stroke: INK,
  })
  const leftTick = gen.line(0, 0, 0, tickH * 2, {
    seed: seed + 1,
    roughness: 0.5,
    strokeWidth: SCALE_BAR_SW,
    stroke: INK,
  })
  const rightTick = gen.line(barPx, 0, barPx, tickH * 2, {
    seed: seed + 2,
    roughness: 0.5,
    strokeWidth: SCALE_BAR_SW,
    stroke: INK,
  })

  const group = new Konva.Group({ x, y })
  group.add(
    new Konva.Shape({
      name: 'scale-bar',
      x: -sw,
      y: 0,
      width: barPx + sw * 2,
      height: tickH * 2 + sw,
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        rc.draw(barLine)
        rc.draw(leftTick)
        rc.draw(rightTick)
      },
    }),
    new Konva.Text({
      x: 0,
      y: tickH * 2 + mmToPx(1),
      width: barPx,
      text: `${barMeters} m`,
      fontSize: ptToPx(8),
      fontFamily: FONT,
      fill: INK,
      align: 'center',
      name: 'scale-bar-label',
    }),
    new Konva.Text({
      x: barPx + mmToPx(3),
      y: tickH - ptToPx(8) / 2,
      text: `1:${scale}`,
      fontSize: ptToPx(8),
      fontFamily: FONT,
      fill: INK_MUTED,
      name: 'scale-ratio',
    }),
  )
  layer.add(group)
}

function drawLegend(layer: Konva.Layer, groups: LegendGroup[], x: number, y: number): void {
  if (groups.length === 0) return

  const rowH = mmToPx(7)
  const headingH = mmToPx(6)
  const groupGap = mmToPx(4)
  const titleH = mmToPx(8)
  const swatchSz = mmToPx(4)

  layer.add(
    new Konva.Text({
      x,
      y,
      text: 'Legend',
      fontSize: ptToPx(10),
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
    }),
  )
  let cursor = y + titleH

  for (const group of groups) {
    layer.add(
      new Konva.Text({
        x,
        y: cursor,
        text: `Layer ${group.layer} — ${LAYER_NAMES[group.layer] ?? ''}`,
        fontSize: ptToPx(8),
        fontStyle: 'bold',
        fontFamily: FONT,
        fill: INK_MUTED,
      }),
    )
    cursor += headingH
    for (const entry of group.entries) {
      layer.add(
        new Konva.Rect({
          x,
          y: cursor,
          width: swatchSz,
          height: swatchSz,
          fill: entry.color,
          opacity: 0.7,
          name: 'legend-swatch',
        }),
        new Konva.Text({
          x: x + swatchSz + mmToPx(2),
          y: cursor,
          text: entry.name,
          fontSize: ptToPx(9),
          fontFamily: FONT,
          fill: INK,
          name: 'legend-label',
        }),
      )
      cursor += rowH
    }
    cursor += groupGap
  }
}

// ── Main export renderer ───────────────────────────────────────────────────────

/**
 * Build a Konva stage for the complete A4 export sheet at 300 dpi.
 *
 * Stage is sized to exactly 2480 × 3508 px (portrait) or 3508 × 2480 px
 * (landscape) — A4 at 300 dpi. Use pixelRatio 1 in toDataURL; EXPORT_PIXEL_RATIO
 * is removed because the stage is already the correct pixel size.
 *
 * Orientation and scale are chosen to maximise the printed map scale.
 * All garden coordinates are computed as metres × pxPerMeter (paper pixels).
 * Stroke widths and font sizes are paper-unit constants independent of garden size.
 */
export function renderExportStage(garden: Garden, catalog: CatalogItem[]): Konva.Stage {
  // ── Sheet & scale ──────────────────────────────────────────────────────────
  const orientation = chooseOrientation(garden.widthMeters, garden.heightMeters)
  const { width, height } = sheetSizePx(orientation)
  const { w: mapAreaW_mm, h: mapAreaH_mm } = mapAreaMm(orientation)
  const scale = pickScale(garden.widthMeters, garden.heightMeters, mapAreaW_mm, mapAreaH_mm)
  // Paper pixels per garden metre: (1000/scale) mm/m × PX_PER_MM px/mm
  const pxPerMeter = (1000 / scale) * PX_PER_MM

  // ── Layout in paper pixels ─────────────────────────────────────────────────
  const margin = mmToPx(MARGIN_MM)
  const titleH = mmToPx(TITLE_H_MM)
  const labelSideW = mmToPx(LABEL_SIDE_MM)
  const labelTopH = mmToPx(LABEL_TOP_MM)
  const legendW = mmToPx(LEGEND_W_MM)

  // Map column: from left margin to just before the legend, below the title block
  const mapColX = margin
  const mapColY = margin + titleH
  const mapColW = width - 2 * margin - legendW
  const mapColH = height - mapColY - margin

  // Garden drawing dimensions in paper pixels
  const gardenDrawW = garden.widthMeters * pxPerMeter
  const gardenDrawH = garden.heightMeters * pxPerMeter

  // Available area inside map column after reserving label gutters
  const gardenAreaW = mapColW - labelSideW
  const gardenAreaH = mapColH - labelTopH

  // Centre the garden drawing in the available area
  const gardenX = mapColX + labelSideW + Math.round((gardenAreaW - gardenDrawW) / 2)
  const gardenY = mapColY + labelTopH + Math.round((gardenAreaH - gardenDrawH) / 2)

  const legendX = width - margin - legendW
  const step = gridStepMeters(scale)

  // ── Build stage ────────────────────────────────────────────────────────────
  const stage = new Konva.Stage({ container: document.createElement('div'), width, height })
  const content = new Konva.Layer()
  stage.add(content)

  // Paper background
  content.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: PAPER, name: 'background' }))

  // Title block ──────────────────────────────────────────────────────────────
  // Left side: name + subtitle (dimensions) + scale bar
  // Right side (near legend): compass
  const titleTextX = mapColX + labelSideW
  const titleTextW = legendX - titleTextX - mmToPx(20) // leave 20 mm for the compass

  const yName = margin + mmToPx(3)
  const yDims = yName + ptToPx(14) + mmToPx(1.5)
  const yBar = yDims + ptToPx(9) + mmToPx(2)

  content.add(
    new Konva.Text({
      x: titleTextX,
      y: yName,
      width: titleTextW,
      text: garden.name,
      fontSize: ptToPx(14),
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      name: 'title',
    }),
    new Konva.Text({
      x: titleTextX,
      y: yDims,
      text: `${garden.widthMeters} m × ${garden.heightMeters} m`,
      fontSize: ptToPx(9),
      fontFamily: FONT,
      fill: INK_MUTED,
      name: 'dimensions',
    }),
  )
  drawScaleBar(content, titleTextX, yBar, scale)
  drawCompass(content, legendX - mmToPx(12), margin + mmToPx(2), garden.id)

  // Garden layer — (0,0) is the garden's top-left corner in paper pixels ────
  const gardenLayer = new Konva.Layer({ x: gardenX, y: gardenY })
  stage.add(gardenLayer)
  drawGrid(gardenLayer, garden.id, garden.widthMeters, garden.heightMeters, pxPerMeter, step)
  drawDimensionLabels(gardenLayer, garden.widthMeters, garden.heightMeters, pxPerMeter, step)

  const catalogById = new Map(catalog.map((c) => [c.catalogId, c]))
  const placed = garden.items
    .map((item) => ({ item, catalogItem: catalogById.get(item.catalogId) }))
    .filter(
      (p): p is { item: GardenItem; catalogItem: CatalogItem } => p.catalogItem !== undefined,
    )
    .sort((a, b) => a.catalogItem.layer - b.catalogItem.layer)
  for (const { item, catalogItem } of placed) drawItem(gardenLayer, item, catalogItem, pxPerMeter)

  // Legend ────────────────────────────────────────────────────────────────────
  const groups = buildLegendGroups(garden, catalog)
  drawLegend(content, groups, legendX, mapColY)

  stage.draw()
  return stage
}
