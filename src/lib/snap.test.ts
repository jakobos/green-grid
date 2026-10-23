import { describe, it, expect } from 'vitest'
import { snapPosition } from './snap'

describe('snapPosition', () => {
  it('returns 0 for 0', () => {
    expect(snapPosition(0)).toBe(0)
  })

  it('never returns -0 for inputs that round to zero', () => {
    expect(Object.is(snapPosition(-0.2), -0)).toBe(false)
  })

  // x.25 boundaries — equidistant; JS Math.round rounds half-up
  it('snaps x.25 up to x.5 (half-up tie-break)', () => {
    expect(snapPosition(0.25)).toBe(0.5)
    expect(snapPosition(1.25)).toBe(1.5)
    expect(snapPosition(2.25)).toBe(2.5)
  })

  // x.75 boundaries — equidistant; rounds up to next whole
  it('snaps x.75 up to the next whole meter (half-up tie-break)', () => {
    expect(snapPosition(0.75)).toBe(1)
    expect(snapPosition(1.75)).toBe(2)
    expect(snapPosition(2.75)).toBe(3)
  })

  it('snaps values below midpoint down', () => {
    // 2.2 → nearest 0.5 step is 2.0 (distance 0.2 vs 0.3)
    expect(snapPosition(2.2)).toBe(2)
    // 2.3 → nearest is 2.5 (distance 0.3 vs 0.2)
    expect(snapPosition(2.3)).toBe(2.5)
  })

  it('snaps negative positions correctly', () => {
    expect(snapPosition(-0.3)).toBe(-0.5)
    expect(snapPosition(-0.2)).toBe(0)
    expect(snapPosition(-1.3)).toBe(-1.5)
    expect(snapPosition(-1.8)).toBe(-2)
  })

  it('returns exact multiples of 0.5 (no floating-point drift)', () => {
    // All results must be exactly representable as n * 0.5
    for (const input of [0.1, 0.3, 0.6, 0.9, 1.1, 1.4, 2.6, 3.9]) {
      const result = snapPosition(input)
      expect(result % 0.5).toBe(0)
    }
  })
})
