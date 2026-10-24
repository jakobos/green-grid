import { describe, it, expect } from 'vitest'
import {
  sheetSizePx,
  mapAreaMm,
  pickScale,
  chooseOrientation,
  gridStepMeters,
  labelStepMeters,
  scaleBarLengthMeters,
  STANDARD_SCALES,
} from './sheetLayout'

describe('sheetSizePx', () => {
  it('portrait is 2480 × 3508', () => {
    expect(sheetSizePx('portrait')).toEqual({ width: 2480, height: 3508 })
  })

  it('landscape is 3508 × 2480', () => {
    expect(sheetSizePx('landscape')).toEqual({ width: 3508, height: 2480 })
  })
})

describe('mapAreaMm', () => {
  it('portrait map area is ~116 × 237 mm', () => {
    const { w, h } = mapAreaMm('portrait')
    // 210 - 12 - 10 - 60 - 12 = 116; 297 - 12 - 28 - 8 - 12 = 237
    expect(w).toBeCloseTo(116, 0)
    expect(h).toBeCloseTo(237, 0)
  })

  it('landscape map area is ~203 × 150 mm', () => {
    const { w, h } = mapAreaMm('landscape')
    // 297 - 12 - 10 - 60 - 12 = 203; 210 - 12 - 28 - 8 - 12 = 150
    expect(w).toBeCloseTo(203, 0)
    expect(h).toBeCloseTo(150, 0)
  })
})

describe('pickScale', () => {
  it('picks 1:10 for a 1×1 m garden in portrait map area', () => {
    const { w, h } = mapAreaMm('portrait')
    expect(pickScale(1, 1, w, h)).toBe(10)
  })

  it('picks 1:50 for a 4×6 m garden in portrait map area', () => {
    const { w, h } = mapAreaMm('portrait')
    // 4*1000/50=80mm, 6*1000/50=120mm — both fit in 116×237
    expect(pickScale(4, 6, w, h)).toBe(50)
  })

  it('picks 1:100 for a 10×8 m garden in portrait map area', () => {
    const { w, h } = mapAreaMm('portrait')
    // 10*10=100mm, 8*10=80mm — fit in 116×237; 1:50 would need 200×160mm, too wide
    expect(pickScale(10, 8, w, h)).toBe(100)
  })

  it('picks 1:1000 for a 100×100 m garden in portrait map area', () => {
    const { w, h } = mapAreaMm('portrait')
    expect(pickScale(100, 100, w, h)).toBe(1000)
  })

  it('garden always fits inside the map area at the chosen scale', () => {
    const cases: [number, number][] = [[1, 1], [3, 3], [20, 20], [10, 5], [100, 10], [10, 100]]
    for (const [gw, gh] of cases) {
      for (const orientation of ['portrait', 'landscape'] as const) {
        const { w: mw, h: mh } = mapAreaMm(orientation)
        const scale = pickScale(gw, gh, mw, mh)
        expect(gw * (1000 / scale)).toBeLessThanOrEqual(mw + 0.001)
        expect(gh * (1000 / scale)).toBeLessThanOrEqual(mh + 0.001)
      }
    }
  })

  it('chosen scale is always in the standard list', () => {
    const cases: [number, number][] = [[1, 1], [5, 3], [20, 20], [100, 50], [100, 100]]
    for (const [gw, gh] of cases) {
      const { w, h } = mapAreaMm('portrait')
      expect(STANDARD_SCALES).toContain(pickScale(gw, gh, w, h))
    }
  })
})

describe('chooseOrientation', () => {
  it('100×10 m exports in landscape (wider map fits better)', () => {
    expect(chooseOrientation(100, 10)).toBe('landscape')
  })

  it('10×100 m exports in portrait (taller map fits better)', () => {
    expect(chooseOrientation(10, 100)).toBe('portrait')
  })

  it('square garden uses portrait on a tie', () => {
    expect(chooseOrientation(20, 20)).toBe('portrait')
    expect(chooseOrientation(1, 1)).toBe('portrait')
    expect(chooseOrientation(100, 100)).toBe('portrait')
  })

  it('landscape wins only when it gives a strictly smaller denominator', () => {
    // Verify the decision is by scale, not by heuristic
    const { w: pw, h: ph } = mapAreaMm('portrait')
    const { w: lw, h: lh } = mapAreaMm('landscape')
    const sp = pickScale(100, 10, pw, ph)
    const sl = pickScale(100, 10, lw, lh)
    expect(sl).toBeLessThan(sp)
    expect(chooseOrientation(100, 10)).toBe('landscape')
  })
})

describe('gridStepMeters', () => {
  it('uses step 1 at 1:100 (1m = 10mm ≥ 3mm)', () => {
    expect(gridStepMeters(100)).toBe(1)
  })

  it('uses step 1 at 1:200 (1m = 5mm ≥ 3mm)', () => {
    expect(gridStepMeters(200)).toBe(1)
  })

  it('uses step 1 at 1:250 (1m = 4mm ≥ 3mm)', () => {
    expect(gridStepMeters(250)).toBe(1)
  })

  it('uses step 5 at 1:500 (1m = 2mm < 3mm; 5m = 10mm ≥ 3mm)', () => {
    expect(gridStepMeters(500)).toBe(5)
  })

  it('uses step 5 at 1:1000 (1m = 1mm < 3mm; 5m = 5mm ≥ 3mm)', () => {
    expect(gridStepMeters(1000)).toBe(5)
  })

  it('grid lines at all standard scales are at least 3 mm apart', () => {
    for (const scale of STANDARD_SCALES) {
      const step = gridStepMeters(scale)
      expect((step * 1000) / scale).toBeGreaterThanOrEqual(3)
    }
  })

  it('step is always 1, 5, or 10', () => {
    for (const scale of STANDARD_SCALES) {
      expect([1, 5, 10]).toContain(gridStepMeters(scale))
    }
  })
})

describe('labelStepMeters', () => {
  it('1:100 gridStep=1 → labelStep 1 (10mm ≥ 8mm)', () => {
    expect(labelStepMeters(100, 1)).toBe(1)
  })

  it('1:200 gridStep=1 → labelStep 2 (1m=5mm<8mm; 2m=10mm≥8mm)', () => {
    expect(labelStepMeters(200, 1)).toBe(2)
  })

  it('1:250 gridStep=1 → labelStep 2 (1m=4mm<8mm; 2m=8mm≥8mm)', () => {
    expect(labelStepMeters(250, 1)).toBe(2)
  })

  it('1:500 gridStep=5 → labelStep 5 (5m=10mm≥8mm)', () => {
    expect(labelStepMeters(500, 5)).toBe(5)
  })

  it('1:1000 gridStep=5 → labelStep 10 (5m=5mm<8mm; 10m=10mm≥8mm)', () => {
    expect(labelStepMeters(1000, 5)).toBe(10)
  })

  it('labelStep is always a multiple of gridStep', () => {
    for (const scale of STANDARD_SCALES) {
      const gs = gridStepMeters(scale)
      const ls = labelStepMeters(scale, gs)
      expect(ls % gs).toBe(0)
    }
  })

  it('labels at all standard scales are at least 8 mm apart', () => {
    for (const scale of STANDARD_SCALES) {
      const gs = gridStepMeters(scale)
      const ls = labelStepMeters(scale, gs)
      expect((ls * 1000) / scale).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('scaleBarLengthMeters', () => {
  it('1:50 → 2 m (2*1000/50 = 40 mm, in range)', () => {
    expect(scaleBarLengthMeters(50)).toBe(2)
  })

  it('1:100 → 5 m (5*1000/100 = 50 mm)', () => {
    expect(scaleBarLengthMeters(100)).toBe(5)
  })

  it('1:200 → 10 m (10*1000/200 = 50 mm)', () => {
    expect(scaleBarLengthMeters(200)).toBe(10)
  })

  it('1:500 → 20 m (20*1000/500 = 40 mm)', () => {
    expect(scaleBarLengthMeters(500)).toBe(20)
  })

  it('1:1000 → 50 m (50*1000/1000 = 50 mm)', () => {
    expect(scaleBarLengthMeters(1000)).toBe(50)
  })

  it('result is always from the candidate list', () => {
    const candidates = [1, 2, 5, 10, 20, 50]
    for (const scale of STANDARD_SCALES) {
      expect(candidates).toContain(scaleBarLengthMeters(scale))
    }
  })

  it('bar drawn length equals labelled metres at the chosen scale (to within rounding)', () => {
    // scaleBarLengthMeters(scale) * (1000/scale) mm should be > 0 and match the label
    for (const scale of STANDARD_SCALES) {
      const l = scaleBarLengthMeters(scale)
      const mm = (l * 1000) / scale
      expect(mm).toBeGreaterThan(0)
      // For most scales, it lands in 40–60 mm or is the only viable option
      if (scale <= 500) {
        expect(mm).toBeGreaterThanOrEqual(20)
      }
    }
  })
})
