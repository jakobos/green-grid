import type { CatalogItem, Garden } from '@/types/garden'
import { downloadPng } from './downloadPng'
import { renderExportStage } from './renderExportStage'

export function exportGarden(garden: Garden, catalog: CatalogItem[]): void {
  const stage = renderExportStage(garden, catalog)
  try {
    downloadPng(stage, `${garden.name.trim() || 'garden'}.png`)
  } finally {
    stage.destroy()
  }
}
