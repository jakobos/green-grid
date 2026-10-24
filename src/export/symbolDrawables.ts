/**
 * Per-symbol roughjs drawing routines for the hand-drawn export.
 * Each function returns an array of Drawables that together form the symbol,
 * drawn within a bounding box of w × h paper pixels, origin at (0, 0).
 *
 * All stroke widths and gaps are in paper pixels derived from PX_PER_MM so
 * the weight is independent of garden scale.
 */
import type { Drawable, Options } from 'roughjs/bin/core'
import type { RoughGenerator } from 'roughjs/bin/generator'
import type { ItemSymbol } from '@/types/garden'
import { PX_PER_MM } from './sheetLayout'
import { INK } from './exportPalette'

// Paper-unit metrics matching renderExportStage constants.
const ITEM_SW = 0.3 * PX_PER_MM
const HACHURE_GAP = 2.0 * PX_PER_MM

/** Minimum drawn dimension on paper in pixels (2.5 mm at 300 dpi). */
export const MIN_SYMBOL_PX = 2.5 * PX_PER_MM

// ── Option builder ─────────────────────────────────────────────────────────────

function base(colour: string, seed: number, extra: Partial<Options> = {}): Options {
  return {
    seed,
    roughness: 1.2,
    stroke: INK,
    strokeWidth: ITEM_SW,
    fill: colour,
    fillStyle: 'hachure',
    hachureGap: HACHURE_GAP,
    ...extra,
  }
}

// ── Per-symbol routines ────────────────────────────────────────────────────────

/** Scalloped canopy circle filling the item box + small trunk dot. */
function drawTree(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const r = Math.min(w, h) / 2
  const cx = w / 2
  const cy = h / 2
  return [
    // Canopy: diameter = min(w,h), high roughness gives scalloped outline
    gen.ellipse(cx, cy, r * 2, r * 2, base(colour, seed, { roughness: 2.0 })),
    // Trunk: small solid dot inside the lower canopy
    gen.ellipse(cx, cy + r * 0.45, r * 0.20, r * 0.20, {
      seed: seed + 1,
      roughness: 0.5,
      stroke: INK,
      strokeWidth: ITEM_SW,
      fill: INK,
      fillStyle: 'solid',
    }),
  ]
}

/**
 * Three equal lobes arranged in a triangle so the cluster fills the box:
 * one at the top-centre, two at the bottom corners.
 */
function drawShrub(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const r = Math.min(w, h) / 3
  return [
    gen.ellipse(w / 2, r,     r * 2, r * 2, base(colour, seed,     { roughness: 1.5 })),
    gen.ellipse(r,     h - r, r * 2, r * 2, base(colour, seed + 1, { roughness: 1.5 })),
    gen.ellipse(w - r, h - r, r * 2, r * 2, base(colour, seed + 2, { roughness: 1.5 })),
  ]
}

/** Framed rectangle with diagonal soil hatching. */
function drawBed(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const inset = ITEM_SW * 2.5
  return [
    // Outer filled rectangle (the soil)
    gen.rectangle(0, 0, w, h, base(colour, seed, { roughness: 0.8 })),
    // Inner border line — frames the bed like a timber edge
    gen.rectangle(inset, inset, w - inset * 2, h - inset * 2, {
      seed: seed + 1,
      roughness: 0.5,
      stroke: INK,
      strokeWidth: ITEM_SW * 0.6,
    }),
  ]
}

/** Cluster of five small filled dots spanning the full box. */
function drawBulb(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const m = Math.min(w, h)
  const dotR = m * 0.10
  const cx = w / 2
  const cy = h / 2
  const spread = m * 0.38
  const dotOpts = (s: number): Options => base(colour, s, { fillStyle: 'solid', roughness: 0.8 })
  return [
    gen.ellipse(cx,          cy,          dotR * 2, dotR * 2, dotOpts(seed)),
    gen.ellipse(cx - spread, cy,          dotR * 2, dotR * 2, dotOpts(seed + 1)),
    gen.ellipse(cx + spread, cy,          dotR * 2, dotR * 2, dotOpts(seed + 2)),
    gen.ellipse(cx,          cy - spread, dotR * 2, dotR * 2, dotOpts(seed + 3)),
    gen.ellipse(cx,          cy + spread, dotR * 2, dotR * 2, dotOpts(seed + 4)),
  ]
}

/** Cross-hatched ellipse filling nearly the full box — evokes low spreading cover. */
function drawGroundcover(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  return [
    gen.ellipse(w / 2, h / 2, w * 0.98, h * 0.98, base(colour, seed, {
      fillStyle: 'cross-hatch',
      hachureGap: HACHURE_GAP * 0.65,
    })),
  ]
}

/** Stem spanning the full height with two pairs of leaf ovals that reach the side edges. */
function drawHerb(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const lw = w * 0.44   // leaf width — outer edge reaches x≈0 and x≈w
  const lh = h * 0.14   // leaf height
  return [
    // Central stem: nearly full height
    gen.line(w / 2, 0, w / 2, h, {
      seed,
      roughness: 1.0,
      stroke: INK,
      strokeWidth: ITEM_SW,
    }),
    // Upper leaf pair — centres at ≈22% and 78% of width so edges reach 0 and w
    gen.ellipse(w * 0.22, h * 0.28, lw, lh, base(colour, seed + 1, { roughness: 0.9 })),
    gen.ellipse(w * 0.78, h * 0.28, lw, lh, base(colour, seed + 2, { roughness: 0.9 })),
    // Lower leaf pair (slightly smaller)
    gen.ellipse(w * 0.28, h * 0.56, lw * 0.8, lh * 0.8, base(colour, seed + 3, { roughness: 0.9 })),
    gen.ellipse(w * 0.72, h * 0.56, lw * 0.8, lh * 0.8, base(colour, seed + 4, { roughness: 0.9 })),
  ]
}

/** Rectangle with horizontal hatching — evokes planting rows. */
function drawVegetable(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  return [
    gen.rectangle(0, 0, w, h, base(colour, seed, {
      roughness: 0.8,
      hachureAngle: 0,
      hachureGap: HACHURE_GAP * 0.75,
    })),
  ]
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

type SymbolFn = (gen: RoughGenerator, w: number, h: number, colour: string, seed: number) => Drawable[]

const SYMBOL_FNS: Record<ItemSymbol, SymbolFn> = {
  tree: drawTree,
  shrub: drawShrub,
  bed: drawBed,
  bulb: drawBulb,
  groundcover: drawGroundcover,
  herb: drawHerb,
  vegetable: drawVegetable,
}

/**
 * Build roughjs drawables for one item symbol.
 * w and h are in paper pixels; all drawables fit within (0, 0, w, h).
 * Pass `MIN_SYMBOL_PX` as the minimum for both dimensions before calling.
 */
export function drawSymbol(
  gen: RoughGenerator,
  symbol: ItemSymbol,
  w: number,
  h: number,
  colour: string,
  seed: number,
): Drawable[] {
  return SYMBOL_FNS[symbol](gen, w, h, colour, seed)
}
