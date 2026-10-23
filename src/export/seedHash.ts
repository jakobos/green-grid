/**
 * Map a stable string identifier to a deterministic unsigned 32-bit integer
 * suitable as a roughjs `seed` option.  Never falls back to Math.random.
 *
 * Uses the djb2-xor variant: fast, avalanche is sufficient for visual variety.
 */
export function seedHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) ^ s.charCodeAt(i)) | 0
  }
  // >>> 0 gives unsigned 32-bit, so the seed is always a positive integer.
  return h >>> 0
}
