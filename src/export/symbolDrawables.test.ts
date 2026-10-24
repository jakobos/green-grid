import { describe, it, expect } from 'vitest'
import rough from 'roughjs'
import type { ItemSymbol } from '@/types/garden'
import { drawSymbol, MIN_SYMBOL_PX } from './symbolDrawables'
import { seedHash } from './seedHash'
import { PX_PER_MM } from './sheetLayout'

const ALL_SYMBOLS: ItemSymbol[] = [
  'tree',
  'shrub',
  'bed',
  'bulb',
  'groundcover',
  'herb',
  'vegetable',
]

/** Call drawSymbol with a fresh generator to guarantee per-call isolation. */
function draw(sym: ItemSymbol, w: number, h: number, colour: string, seed: number) {
  return drawSymbol(rough.generator(), sym, w, h, colour, seed)
}

describe('drawSymbol', () => {
  it('each symbol is deterministic for the same seed', () => {
    for (const sym of ALL_SYMBOLS) {
      const s1 = draw(sym, 60, 60, '#4A9E6B', seedHash('det-test')).flatMap((d) => d.sets)
      const s2 = draw(sym, 60, 60, '#4A9E6B', seedHash('det-test')).flatMap((d) => d.sets)
      expect(JSON.stringify(s1)).toEqual(JSON.stringify(s2))
    }
  })

  it('each symbol produces structurally different output from every other symbol', () => {
    const seed = seedHash('diff-test')
    const outputs = ALL_SYMBOLS.map((sym) =>
      JSON.stringify(draw(sym, 60, 60, '#4A9E6B', seed).flatMap((d) => d.sets)),
    )
    const unique = new Set(outputs)
    expect(unique.size).toBe(ALL_SYMBOLS.length)
  })

  it('different seeds produce different drawables for the same symbol', () => {
    for (const sym of ALL_SYMBOLS) {
      const s1 = draw(sym, 60, 60, '#4A9E6B', seedHash('item-a')).flatMap((d) => d.sets)
      const s2 = draw(sym, 60, 60, '#4A9E6B', seedHash('item-b')).flatMap((d) => d.sets)
      expect(JSON.stringify(s1)).not.toEqual(JSON.stringify(s2))
    }
  })

  it('each symbol returns at least one Drawable', () => {
    for (const sym of ALL_SYMBOLS) {
      const drawables = draw(sym, 60, 60, '#4A9E6B', seedHash(sym))
      expect(drawables.length).toBeGreaterThan(0)
    }
  })

  it('each symbol drawable has at least one set (path or fillSketch)', () => {
    for (const sym of ALL_SYMBOLS) {
      const drawables = draw(sym, 60, 60, '#4A9E6B', seedHash(sym))
      const types = drawables.flatMap((d) => d.sets.map((s) => s.type))
      expect(types.length).toBeGreaterThan(0)
    }
  })
})

describe('MIN_SYMBOL_PX', () => {
  it('is exactly 2.5 mm in paper pixels at 300 dpi', () => {
    expect(MIN_SYMBOL_PX).toBeCloseTo(2.5 * PX_PER_MM, 5)
  })

  it('is positive', () => {
    expect(MIN_SYMBOL_PX).toBeGreaterThan(0)
  })
})
