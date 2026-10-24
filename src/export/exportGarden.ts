import type { CatalogItem, Garden } from '@/types/garden'
import '@fontsource/patrick-hand'
import { downloadPng } from './downloadPng'
import { downloadPdf } from './downloadPdf'
import { renderExportStage } from './renderExportStage'
import { seedHash } from './seedHash'

/** Stable filename for a garden export: `<name>.<ext>`, falling back to `garden`. */
export function gardenFilename(garden: Garden, ext: string): string {
  return `${garden.name.trim() || 'garden'}.${ext}`
}

/**
 * Derive a 32-hex-char PDF file ID from stable garden inputs.
 * Four independent seedHash calls provide 128 bits of variety without crypto.
 */
function pdfFileId(garden: Garden): string {
  return [0, 1, 2, 3]
    .map((n) =>
      seedHash(`${garden.id}:${garden.updatedAt}:${n}`)
        .toString(16)
        .padStart(8, '0'),
    )
    .join('')
}

/** Export the garden as a PNG download. */
export async function exportGarden(garden: Garden, catalog: CatalogItem[]): Promise<void> {
  await document.fonts.load("1em 'Patrick Hand'")
  const stage = renderExportStage(garden, catalog)
  try {
    downloadPng(stage, gardenFilename(garden, 'png'))
  } finally {
    stage.destroy()
  }
}

/**
 * Export the garden as a one-page A4 PDF download.
 *
 * Creation date and file ID are derived from stable garden fields so that two
 * exports of the same garden are byte-identical.
 */
export async function exportGardenPdf(garden: Garden, catalog: CatalogItem[]): Promise<void> {
  await document.fonts.load("1em 'Patrick Hand'")
  const stage = renderExportStage(garden, catalog)
  try {
    downloadPdf(
      stage,
      gardenFilename(garden, 'pdf'),
      new Date(garden.updatedAt),
      pdfFileId(garden),
    )
  } finally {
    stage.destroy()
  }
}
