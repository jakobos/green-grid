import Konva from 'konva'
import rough from 'roughjs'
import type { Drawable } from 'roughjs/bin/core'
import type { CatalogItem, Garden, GardenItem } from '@/types/garden'
import { LAYER_NAMES } from '@/data/catalog'
import { seedHash } from './seedHash'
import { drawSymbol, MIN_SYMBOL_PX } from './symbolDrawables'
import {
  PX_PER_MM,
  mmToPx,
  ptToPx,
  sheetSizePx,
  mapAreaMm,
  pickScale,
  chooseOrientation,
  gridStepMeters,
  labelStepMeters,
  scaleBarLengthMeters,
  MARGIN_MM,
  TITLE_H_MM,
  LABEL_SIDE_MM,
  LABEL_TOP_MM,
  LEGEND_W_MM,
  LEGEND_CONTENT_GAP_MM,
} from './sheetLayout'
import { PAPER, INK, INK_MUTED, GRID_STROKE, BOUNDARY_STROKE } from './exportPalette'

// ── Paper-unit stroke widths ───────────────────────────────────────────────────
// All values are in paper pixels (= mm × PX_PER_MM) so they are independent of
// garden size: a 3 m bed and a 100 m plot print with identical line weights.
const GRID_SW = 0.1 * PX_PER_MM       // fine grid lines: 0.1 mm
const BOUNDARY_SW = 0.45 * PX_PER_MM  // garden boundary: 0.45 mm
const COMPASS_SW = 0.5 * PX_PER_MM    // compass strokes: 0.5 mm
const SCALE_BAR_SW = 0.45 * PX_PER_MM // scale bar: same weight as boundary

const FONT = 'Patrick Hand'

// ── Marker constants (paper-unit) ─────────────────────────────────────────────
const MARKER_R_PX = mmToPx(2)           // 4 mm circle → 2 mm radius
const MARKER_THRESHOLD_PX = mmToPx(8)   // centre on item when drawn symbol ≥ 8 mm
const MARKER_DEDUPE_PX = mmToPx(6)      // collapse same-number markers within 6 mm

export type LegendEntry = { catalogItem: CatalogItem; qty: number }
export type LegendGroup = { layer: number; entries: LegendEntry[] }

export function buildLegendGroups(garden: Garden, catalog: CatalogItem[]): LegendGroup[] {
  const qtys = new Map<string, number>()
  for (const gItem of garden.items) {
    qtys.set(gItem.catalogId, (qtys.get(gItem.catalogId) ?? 0) + 1)
  }
  const byLayer = new Map<number, LegendEntry[]>()
  for (const entry of catalog) {
    const qty = qtys.get(entry.catalogId)
    if (!qty) continue
    byLayer.set(entry.layer, [...(byLayer.get(entry.layer) ?? []), { catalogItem: entry, qty }])
  }
  return [...byLayer.entries()]
    .sort(([a], [b]) => a - b)
    .map(([layer, entries]) => ({ layer, entries }))
}

/** Map catalogId → 1-based marker number, in buildLegendGroups order. */
export function buildMarkerNumbers(groups: LegendGroup[]): Map<string, number> {
  const map = new Map<string, number>()
  let n = 1
  for (const group of groups) {
    for (const entry of group.entries) {
      map.set(entry.catalogItem.catalogId, n++)
    }
  }
  return map
}

/**
 * Format a monetary amount in euros with two decimals and thousands commas.
 * Hand-rolled to avoid Intl/toLocaleString locale dependence.
 * Examples: 0 → '€0.00', 0.4 → '€0.40', 1215 → '€1,215.00', 12345.5 → '€12,345.50'
 */
export function formatEuro(amount: number): string {
  const cents = Math.round(amount * 100)
  const eurosInt = Math.floor(cents / 100)
  const dec = String(cents % 100).padStart(2, '0')
  const eurosStr = String(eurosInt).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `€${eurosStr}.${dec}`
}

/** Sum of qty × estimatedCostEur across all legend entries. */
export function computeLegendTotal(groups: LegendGroup[]): number {
  let total = 0
  for (const group of groups) {
    for (const entry of group.entries) {
      total += entry.qty * entry.catalogItem.estimatedCostEur
    }
  }
  return total
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
  gridStep: number,
): void {
  const gen = rough.generator()
  const w = widthMeters * pxPerMeter
  const h = heightMeters * pxPerMeter

  const gridDrawables: Drawable[] = []
  for (let col = 0; col <= widthMeters; col += gridStep) {
    gridDrawables.push(
      gen.line(col * pxPerMeter, 0, col * pxPerMeter, h, {
        seed: seedHash(`${gardenId}:gv:${col}`),
        roughness: 0.4,
        strokeWidth: GRID_SW,
        stroke: GRID_STROKE,
      }),
    )
  }
  for (let row = 0; row <= heightMeters; row += gridStep) {
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
 * Place numeric metre labels every `labelStep` metres along the top (x-axis)
 * and left (y-axis) edges. labelStep is a multiple of the grid step so every
 * label falls on a grid line; the larger spacing keeps labels ≥ 8 mm apart.
 * Labels are drawn at negative offsets into the gutter reserved by
 * LABEL_SIDE_MM and LABEL_TOP_MM above and to the left of the garden origin.
 */
function drawDimensionLabels(
  layer: Konva.Layer,
  widthMeters: number,
  heightMeters: number,
  pxPerMeter: number,
  labelStep: number,
): void {
  const labelW = mmToPx(10)
  const labelH = mmToPx(4)
  const fontSize = ptToPx(8) // ≥ 8 pt minimum per spec

  for (let col = 0; col <= widthMeters; col += labelStep) {
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
  for (let row = 0; row <= heightMeters; row += labelStep) {
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
 * Draw one placed garden item as its hand-drawn symbol.
 * Items smaller than MIN_SYMBOL_PX on either axis are drawn at that minimum
 * size, centred on the item's map position.
 */
function drawItem(
  layer: Konva.Layer,
  item: GardenItem,
  catalogItem: CatalogItem,
  pxPerMeter: number,
): void {
  const w = item.widthMeters * pxPerMeter
  const h = item.heightMeters * pxPerMeter
  const drawnW = Math.max(w, MIN_SYMBOL_PX)
  const drawnH = Math.max(h, MIN_SYMBOL_PX)
  const gen = rough.generator()
  const drawables = drawSymbol(
    gen,
    catalogItem.symbol,
    drawnW,
    drawnH,
    catalogItem.color,
    seedHash(item.id),
  )

  const group = new Konva.Group({
    x: item.xMeters * pxPerMeter + w / 2,
    y: item.yMeters * pxPerMeter + h / 2,
    offsetX: drawnW / 2,
    offsetY: drawnH / 2,
    rotation: item.rotationDeg,
    name: 'garden-item',
  })
  group.add(
    new Konva.Shape({
      width: drawnW,
      height: drawnH,
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        for (const d of drawables) rc.draw(d)
      },
    }),
  )
  layer.add(group)
}

/**
 * Draw the hand-drawn north compass: rough arrow shaft + filled triangle head.
 * The design from C007 is scaled to 14 mm paper height (pxPerMeter-independent).
 * Arrow points in the northDeg direction (clockwise from up); "N" stays upright
 * just past the arrow tip. Both are centred at (x, y); seed from gardenId.
 */
function drawCompass(layer: Konva.Layer, x: number, y: number, northDeg: number, gardenId: string): void {
  // Scale old 60 px design to 14 mm paper height
  const shapeH = mmToPx(14)
  const s = shapeH / 60
  const halfW = Math.round(7 * s) // arrowhead half-width
  const sw = Math.ceil(COMPASS_SW)

  const gen = rough.generator()
  const seed = seedHash(`${gardenId}:compass`)

  // ── Rotate arrow geometry ─────────────────────────────────────────────────
  // All points centred at (0, 0); north-up is negative y.
  // clockwise rotation in screen coords: x' = x·cos − y·sin, y' = x·sin + y·cos
  const rad = (northDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  function rot(px: number, py: number): [number, number] {
    return [px * cos - py * sin, px * sin + py * cos]
  }

  // Key y-levels in north-up frame (centre = 0, negative y = up)
  const [tipX, tipY]           = rot(0, -18 * s) // arrow tip
  const [shaftEndX, shaftEndY] = rot(0, -8 * s)  // shaft–head junction
  const [shaftBaseX, shaftBaseY] = rot(0, 18 * s) // tail of shaft
  const [headLX, headLY]       = rot(-halfW, -6 * s) // head base left
  const [headRX, headRY]       = rot(halfW, -6 * s)  // head base right

  // Square shape centred at (0, 0); add R to convert group-local → shape-local
  const R = Math.round(20 * s + sw + 1)
  const sl = (px: number, py: number): [number, number] => [px + R, py + R]

  const [sb0, sb1] = sl(shaftBaseX, shaftBaseY)
  const [se0, se1] = sl(shaftEndX, shaftEndY)
  const shaft = gen.line(sb0, sb1, se0, se1, {
    seed,
    roughness: 0.8,
    strokeWidth: COMPASS_SW,
    stroke: INK,
  })
  const head = gen.polygon(
    [sl(tipX, tipY), sl(headLX, headLY), sl(headRX, headRY)],
    {
      seed: seed + 1,
      roughness: 0.8,
      stroke: INK,
      fill: INK,
      fillStyle: 'solid',
    },
  )

  // ── "N" label — upright, centred at tipR + nSize/2 in the arrow direction ─
  const nSize = ptToPx(10)
  // Arrow direction (screen): (sin, −cos); position N past the tip
  const nDist = 18 * s + nSize / 2
  const nCX = nDist * sin
  const nCY = -nDist * cos

  const group = new Konva.Group({ x, y })
  group.add(
    new Konva.Text({
      x: nCX - nSize / 2,
      y: nCY - nSize / 2,
      width: nSize,
      height: nSize,
      text: 'N',
      fontSize: nSize,
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      align: 'center',
      verticalAlign: 'middle',
    }),
    new Konva.Shape({
      name: 'compass',
      x: -R,
      y: -R,
      width: 2 * R,
      height: 2 * R,
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

/**
 * Draw a rough ink circle (4 mm diameter) with the marker number centred inside.
 * cx, cy are the marker centre in the layer's local coordinate space.
 * The circle has a paper fill so it reads clearly on top of any symbol.
 */
function drawCircledNumber(
  layer: Konva.Layer,
  cx: number,
  cy: number,
  num: number,
  seed: number,
  groupName = 'marker',
): void {
  const r = MARKER_R_PX
  const gen = rough.generator()
  const circle = gen.ellipse(r, r, r * 2, r * 2, {
    seed,
    roughness: 0.8,
    stroke: INK,
    strokeWidth: 0.3 * PX_PER_MM,
    fill: PAPER,
    fillStyle: 'solid',
  })
  const group = new Konva.Group({ x: cx - r, y: cy - r, name: groupName })
  group.add(
    new Konva.Shape({
      width: r * 2,
      height: r * 2,
      name: 'marker-circle',
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        rc.draw(circle)
      },
    }),
    new Konva.Text({
      x: 0,
      y: 0,
      width: r * 2,
      height: r * 2,
      text: String(num),
      fontSize: ptToPx(8),
      fontFamily: FONT,
      fill: INK,
      align: 'center',
      verticalAlign: 'middle',
      name: 'marker-label',
    }),
  )
  layer.add(group)
}

function drawLegend(
  layer: Konva.Layer,
  groups: LegendGroup[],
  markerNumbers: Map<string, number>,
  x: number,
  y: number,
): void {
  if (groups.length === 0) return

  const rowH = mmToPx(6)       // tightened from 7 mm to fit 15 types + total row
  const headingH = mmToPx(5)   // tightened from 6 mm
  const groupGap = mmToPx(4)
  const titleH = mmToPx(8)
  const swatchSz = mmToPx(4)
  const markerD = MARKER_R_PX * 2
  const itemGap = mmToPx(2)
  const swatchOffX = markerD + itemGap
  const nameOffX = markerD + itemGap + swatchSz + itemGap  // 12 mm from content left
  const contentW = mmToPx(LEGEND_W_MM - LEGEND_CONTENT_GAP_MM)  // 52 mm
  // Right-aligned columns: cost 11 mm, qty 7 mm, name gets the rest (22 mm).
  const costW = mmToPx(11)
  const qtyW = mmToPx(7)
  const nameW = contentW - nameOffX - qtyW - costW
  const costX = x + contentW - costW
  const qtyX = costX - qtyW

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
    for (const { catalogItem: entry, qty } of group.entries) {
      const num = markerNumbers.get(entry.catalogId) ?? 0
      const rowMidY = cursor + swatchSz / 2
      drawCircledNumber(layer, x + MARKER_R_PX, rowMidY, num, seedHash(entry.catalogId + ':num'), 'legend-marker')
      const rowCost = qty * entry.estimatedCostEur
      layer.add(
        new Konva.Shape({
          x: x + swatchOffX,
          y: cursor,
          width: swatchSz,
          height: swatchSz,
          name: 'legend-swatch',
          sceneFunc(ctx) {
            const rc = rough.canvas(ctx.canvas._canvas)
            const swatchGen = rough.generator()
            const swatchDrawables = drawSymbol(
              swatchGen,
              entry.symbol,
              swatchSz,
              swatchSz,
              entry.color,
              seedHash(entry.catalogId),
            )
            for (const d of swatchDrawables) rc.draw(d)
          },
        }),
        new Konva.Text({
          x: x + nameOffX,
          y: cursor,
          width: nameW,
          wrap: 'none',
          text: entry.name,
          fontSize: ptToPx(9),
          fontFamily: FONT,
          fill: INK,
          name: 'legend-label',
        }),
        new Konva.Text({
          x: qtyX,
          y: cursor,
          width: qtyW,
          align: 'right',
          text: `×${qty}`,
          fontSize: ptToPx(9),
          fontFamily: FONT,
          fill: INK,
          name: 'legend-qty',
        }),
        new Konva.Text({
          x: costX,
          y: cursor,
          width: costW,
          align: 'right',
          text: formatEuro(rowCost),
          fontSize: ptToPx(9),
          fontFamily: FONT,
          fill: INK,
          name: 'legend-cost',
        }),
      )
      cursor += rowH
    }
    cursor += groupGap
  }

  // Thin rough rule, then bold "Estimated total" row
  const ruleY = cursor
  layer.add(
    new Konva.Shape({
      x,
      y: ruleY,
      width: contentW,
      height: mmToPx(2),
      name: 'legend-rule',
      sceneFunc(ctx) {
        const rc = rough.canvas(ctx.canvas._canvas)
        const gen = rough.generator()
        rc.draw(
          gen.line(0, 0, contentW, 0, {
            roughness: 0.4,
            stroke: INK,
            strokeWidth: 0.5 * PX_PER_MM,
            seed: seedHash('legend:total-rule'),
          }),
        )
      },
    }),
  )
  cursor += mmToPx(2)
  const total = computeLegendTotal(groups)
  layer.add(
    new Konva.Text({
      x,
      y: cursor,
      text: 'Estimated total',
      fontSize: ptToPx(9),
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      name: 'legend-total-label',
    }),
    new Konva.Text({
      x: costX,
      y: cursor,
      width: costW,
      align: 'right',
      text: formatEuro(total),
      fontSize: ptToPx(9),
      fontStyle: 'bold',
      fontFamily: FONT,
      fill: INK,
      name: 'legend-total-cost',
    }),
  )
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
  const gridStep = gridStepMeters(scale)
  const labelStep = labelStepMeters(scale, gridStep)

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
  drawCompass(content, legendX - mmToPx(12), margin + mmToPx(11), garden.northDeg, garden.id)

  // Garden layer — (0,0) is the garden's top-left corner in paper pixels ────
  const gardenLayer = new Konva.Layer({ x: gardenX, y: gardenY })
  stage.add(gardenLayer)
  drawGrid(gardenLayer, garden.id, garden.widthMeters, garden.heightMeters, pxPerMeter, gridStep)
  drawDimensionLabels(gardenLayer, garden.widthMeters, garden.heightMeters, pxPerMeter, labelStep)

  const catalogById = new Map(catalog.map((c) => [c.catalogId, c]))
  const placed = garden.items
    .map((item) => ({ item, catalogItem: catalogById.get(item.catalogId) }))
    .filter(
      (p): p is { item: GardenItem; catalogItem: CatalogItem } => p.catalogItem !== undefined,
    )
    .sort((a, b) => a.catalogItem.layer - b.catalogItem.layer)
  for (const { item, catalogItem } of placed) drawItem(gardenLayer, item, catalogItem, pxPerMeter)

  // Legend & marker numbers ──────────────────────────────────────────────────
  const groups = buildLegendGroups(garden, catalog)
  const markerNumbers = buildMarkerNumbers(groups)
  drawLegend(content, groups, markerNumbers, legendX + mmToPx(LEGEND_CONTENT_GAP_MM), mapColY)

  // Markers on plan — upright circles in garden order, same-number dedupe ──
  const drawnMarkers: { num: number; cx: number; cy: number }[] = []
  for (const gItem of garden.items) {
    const catalogItem = catalogById.get(gItem.catalogId)
    if (!catalogItem) continue
    const num = markerNumbers.get(catalogItem.catalogId)
    if (num === undefined) continue

    const w = gItem.widthMeters * pxPerMeter
    const h = gItem.heightMeters * pxPerMeter
    const drawnW = Math.max(w, MIN_SYMBOL_PX)
    const drawnH = Math.max(h, MIN_SYMBOL_PX)
    // Centre of item in gardenLayer coords
    const itemCx = gItem.xMeters * pxPerMeter + w / 2
    const itemCy = gItem.yMeters * pxPerMeter + h / 2
    // If drawn symbol is ≥ 8 mm on both axes: centre on symbol.
    // Otherwise: push the marker outside the top-right corner by its own
    // radius plus 0.5 mm so the paper fill never covers the drawn symbol.
    const isSmall = !(drawnW >= MARKER_THRESHOLD_PX && drawnH >= MARKER_THRESHOLD_PX)
    const cornerOffsetPx = MARKER_R_PX + mmToPx(0.5)
    const markerCx = isSmall ? itemCx + drawnW / 2 + cornerOffsetPx : itemCx
    const markerCy = isSmall ? itemCy - drawnH / 2 - cornerOffsetPx : itemCy
    // Dedupe: skip if same number already within 6 mm of this position
    if (
      drawnMarkers.some(
        (m) => m.num === num && Math.hypot(m.cx - markerCx, m.cy - markerCy) < MARKER_DEDUPE_PX,
      )
    )
      continue
    drawnMarkers.push({ num, cx: markerCx, cy: markerCy })
    drawCircledNumber(gardenLayer, markerCx, markerCy, num, seedHash(`${gItem.id}:marker`), 'plan-marker')
  }

  stage.draw()
  return stage
}
