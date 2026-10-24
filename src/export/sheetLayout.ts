/**
 * A4 sheet layout math for the hand-drawn garden plan export.
 * All functions are pure: no DOM, no Konva, no roughjs.
 * Coordinates returned are in paper pixels (300 dpi) unless the name says _mm.
 */

// ── Units ────────────────────────────────────────────────────────────────────

/** 300 dpi: paper pixels per millimetre. */
export const PX_PER_MM = 300 / 25.4

/** Convert mm to paper pixels (rounds to nearest integer). */
export function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM)
}

/** Convert typographic points to paper pixels (1 pt = 1/72 inch at 300 dpi). */
export function ptToPx(pt: number): number {
  return Math.round(pt * (300 / 72))
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

export type SheetOrientation = 'portrait' | 'landscape'

/**
 * A4 sheet size in paper pixels at 300 dpi.
 * Portrait: 2480 × 3508  Landscape: 3508 × 2480
 */
export function sheetSizePx(orientation: SheetOrientation): { width: number; height: number } {
  return orientation === 'portrait'
    ? { width: 2480, height: 3508 }
    : { width: 3508, height: 2480 }
}

// ── Layout constants (mm) ─────────────────────────────────────────────────────

/** Sheet margin on all four sides. */
export const MARGIN_MM = 12
/** Title block height: garden name + subtitle + scale bar. */
export const TITLE_H_MM = 28
/** Width reserved on the left of the map area for metre-label text. */
export const LABEL_SIDE_MM = 10
/** Height reserved above the map area for metre-label text. */
export const LABEL_TOP_MM = 8
/** Fixed-width legend column on the right. */
export const LEGEND_W_MM = 60
/**
 * Horizontal gap between the map column's right edge and the legend content.
 * The rightmost metre label is centred on the map's right edge, so it extends
 * LABEL_SIDE_MM/2 = 5 mm into the gap. Adding 3 mm safety gives 8 mm total.
 * Applied to the legend content x, not to mapAreaMm, so scale selection is
 * unaffected.
 */
export const LEGEND_CONTENT_GAP_MM = 8

// ── Map area ──────────────────────────────────────────────────────────────────

/**
 * Available garden-drawing area in mm for the given orientation.
 * This is the space inside the margin, title block, label gutters and legend column.
 */
export function mapAreaMm(orientation: SheetOrientation): { w: number; h: number } {
  const sheetW = orientation === 'portrait' ? 210 : 297
  const sheetH = orientation === 'portrait' ? 297 : 210
  return {
    w: sheetW - MARGIN_MM - LABEL_SIDE_MM - LEGEND_W_MM - MARGIN_MM,
    h: sheetH - MARGIN_MM - TITLE_H_MM - LABEL_TOP_MM - MARGIN_MM,
  }
}

// ── Scale ─────────────────────────────────────────────────────────────────────

/** Standard scale denominators, smallest (most zoomed-in) first. */
export const STANDARD_SCALES = [10, 20, 25, 50, 100, 200, 250, 500, 1000] as const
export type StandardScale = (typeof STANDARD_SCALES)[number]

/**
 * Smallest standard scale denominator such that the garden (gardenW × gardenH metres)
 * fits entirely within the given map area (mapW_mm × mapH_mm millimetres).
 * Returns 1000 when no smaller denominator fits (garden ≤ 100×100 m).
 *
 * At denominator N: 1 garden metre = 1000/N mm on paper.
 * The garden fits when gardenW*(1000/N) ≤ mapW AND gardenH*(1000/N) ≤ mapH,
 * i.e. N ≥ max(gardenW*1000/mapW, gardenH*1000/mapH).
 */
export function pickScale(
  gardenW: number,
  gardenH: number,
  mapW_mm: number,
  mapH_mm: number,
): number {
  const minN = Math.max((gardenW * 1000) / mapW_mm, (gardenH * 1000) / mapH_mm)
  return STANDARD_SCALES.find((n) => n >= minN) ?? 1000
}

/**
 * Choose portrait or landscape: whichever orientation lets the garden be drawn
 * at the larger (smaller denominator) standard scale. Ties go to portrait.
 */
export function chooseOrientation(gardenW: number, gardenH: number): SheetOrientation {
  const p = mapAreaMm('portrait')
  const l = mapAreaMm('landscape')
  const scaleP = pickScale(gardenW, gardenH, p.w, p.h)
  const scaleL = pickScale(gardenW, gardenH, l.w, l.h)
  return scaleL < scaleP ? 'landscape' : 'portrait'
}

// ── Grid ──────────────────────────────────────────────────────────────────────

/**
 * Grid-line spacing in metres. Smallest of {1, 5, 10} such that adjacent lines
 * are at least 3 mm apart on paper at the given scale denominator.
 *
 * At denominator N: step metres = step * 1000/N mm on paper.
 * Rule: step * 1000/N ≥ 3 mm.
 *
 * Examples: 1:200 → 1 m (5 mm ≥ 3 mm); 1:500 → 5 m (2 mm < 3 mm, 10 mm ≥ 3 mm).
 */
export function gridStepMeters(scale: number): number {
  if ((1 * 1000) / scale >= 3) return 1
  if ((5 * 1000) / scale >= 3) return 5
  return 10
}

/**
 * Metre-label spacing in metres. Must be a multiple of `gridStep` and place
 * adjacent labels at least 8 mm apart on paper at the given scale denominator.
 *
 * Tries multiples of gridStep by factors [1, 2, 5, 10, 20, 50] and returns the
 * first that satisfies the 8 mm rule, giving labels at nice round positions.
 *
 * Examples (scale, gridStep → labelStep):
 *   1:100, 1 → 1   (10 mm)
 *   1:200, 1 → 2   (10 mm)
 *   1:500, 5 → 5   (10 mm)
 *   1:1000, 5 → 10 (10 mm)
 */
export function labelStepMeters(scale: number, gridStep: number): number {
  for (const k of [1, 2, 5, 10, 20, 50]) {
    if ((gridStep * k * 1000) / scale >= 8) return gridStep * k
  }
  return gridStep * 50
}

// ── Scale bar ─────────────────────────────────────────────────────────────────

const SCALE_BAR_CANDIDATES = [0.5, 1, 2, 5, 10, 20, 50] as const

/**
 * Scale bar length in metres. Prefers the first candidate from {0.5,1,2,5,10,20,50}
 * that falls in the 40–60 mm target range at the given scale denominator.
 * Falls back to the candidate nearest 50 mm when none lands in range.
 */
export function scaleBarLengthMeters(scale: number): number {
  const mmFor = (l: number) => (l * 1000) / scale
  const inRange = SCALE_BAR_CANDIDATES.filter((l) => mmFor(l) >= 40 && mmFor(l) <= 60)
  if (inRange.length > 0) return inRange[0]
  return SCALE_BAR_CANDIDATES.reduce((best, l) =>
    Math.abs(mmFor(l) - 50) < Math.abs(mmFor(best) - 50) ? l : best,
  )
}
