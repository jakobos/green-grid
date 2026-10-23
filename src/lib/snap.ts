export const POSITION_SNAP_METERS = 0.5

/**
 * Snap a position in meters to the nearest POSITION_SNAP_METERS multiple.
 * Result is always an exact multiple of 0.5 (no floating-point drift).
 * Returns 0 (never -0).
 */
export function snapPosition(meters: number): number {
  const snapped = Math.round(meters / POSITION_SNAP_METERS) * POSITION_SNAP_METERS
  return snapped === 0 ? 0 : snapped
}
