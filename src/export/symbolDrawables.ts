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

/** Scalloped canopy circle + small trunk dot. */
function drawTree(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const r = Math.min(w, h) * 0.42
  const cx = w / 2
  const cy = h / 2
  return [
    // Canopy: high roughness makes the outline scalloped/irregular
    gen.ellipse(cx, cy - r * 0.05, r * 2, r * 2, base(colour, seed, { roughness: 2.0 })),
    // Trunk: small solid dot below canopy centre
    gen.ellipse(cx, cy + r * 0.65, r * 0.22, r * 0.22, {
      seed: seed + 1,
      roughness: 0.5,
      stroke: INK,
      strokeWidth: ITEM_SW,
      fill: INK,
      fillStyle: 'solid',
    }),
  ]
}

/** Three overlapping lobes forming a bushy clump — smaller than a tree. */
function drawShrub(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const r = Math.min(w, h) * 0.30
  const cx = w / 2
  const cy = h / 2
  return [
    gen.ellipse(cx - r * 0.65, cy + r * 0.15, r * 1.7, r * 1.7, base(colour, seed, { roughness: 1.5 })),
    gen.ellipse(cx + r * 0.65, cy + r * 0.15, r * 1.7, r * 1.7, base(colour, seed + 1, { roughness: 1.5 })),
    gen.ellipse(cx, cy - r * 0.35, r * 1.7, r * 1.7, base(colour, seed + 2, { roughness: 1.5 })),
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

/** Cluster of five small filled dots. */
function drawBulb(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const dotR = Math.min(w, h) * 0.12
  const cx = w / 2
  const cy = h / 2
  const spread = Math.min(w, h) * 0.28
  const dotOpts = (s: number): Options => base(colour, s, { fillStyle: 'solid', roughness: 0.8 })
  return [
    gen.ellipse(cx, cy, dotR * 2, dotR * 2, dotOpts(seed)),
    gen.ellipse(cx - spread, cy, dotR * 2, dotR * 2, dotOpts(seed + 1)),
    gen.ellipse(cx + spread, cy, dotR * 2, dotR * 2, dotOpts(seed + 2)),
    gen.ellipse(cx, cy - spread, dotR * 2, dotR * 2, dotOpts(seed + 3)),
    gen.ellipse(cx, cy + spread, dotR * 2, dotR * 2, dotOpts(seed + 4)),
  ]
}

/** Cross-hatched ellipse — evokes low spreading cover. */
function drawGroundcover(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  return [
    gen.ellipse(w / 2, h / 2, w * 0.9, h * 0.9, base(colour, seed, {
      fillStyle: 'cross-hatch',
      hachureGap: HACHURE_GAP * 0.65,
    })),
  ]
}

/** Vertical stem with two pairs of opposing leaf ovals — sprig silhouette. */
function drawHerb(gen: RoughGenerator, w: number, h: number, colour: string, seed: number): Drawable[] {
  const lw = w * 0.38
  const lh = h * 0.14
  return [
    // Central stem
    gen.line(w / 2, h * 0.08, w / 2, h * 0.92, {
      seed,
      roughness: 1.0,
      stroke: INK,
      strokeWidth: ITEM_SW,
    }),
    // Upper leaf pair
    gen.ellipse(w * 0.27, h * 0.28, lw, lh, base(colour, seed + 1, { roughness: 0.9 })),
    gen.ellipse(w * 0.73, h * 0.28, lw, lh, base(colour, seed + 2, { roughness: 0.9 })),
    // Lower leaf pair
    gen.ellipse(w * 0.30, h * 0.54, lw * 0.8, lh * 0.8, base(colour, seed + 3, { roughness: 0.9 })),
    gen.ellipse(w * 0.70, h * 0.54, lw * 0.8, lh * 0.8, base(colour, seed + 4, { roughness: 0.9 })),
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
