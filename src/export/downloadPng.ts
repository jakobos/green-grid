import type Konva from 'konva'

/**
 * Trigger a PNG download of the given stage.
 * The stage is already sized to the exact A4 pixel count (2480×3508 or 3508×2480)
 * so pixelRatio 1 produces the correct image without any additional scaling.
 */
export function downloadPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
