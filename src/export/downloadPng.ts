import type Konva from 'konva'
import { EXPORT_PIXEL_RATIO } from './renderExportStage'

export function downloadPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO, mimeType: 'image/png' })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
