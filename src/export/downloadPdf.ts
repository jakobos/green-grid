import { jsPDF } from 'jspdf'
import type Konva from 'konva'

// jsPDF ships setCreationDate at runtime but its published types omit it.
type JsPDFExt = InstanceType<typeof jsPDF> & { setCreationDate(d: Date): void }

/**
 * Rasterise the stage as PNG and wrap it in a single-page A4 PDF download.
 *
 * Orientation is inferred from stage dimensions (landscape when width > height).
 * `creationDate` and `fileId` are caller-supplied so that two exports of the
 * same garden produce byte-identical files.
 *
 * This module is only imported by `exportGarden.ts`, which is itself loaded via
 * the dynamic import boundary in `Header.tsx`. That keeps jspdf (~300 kB) out
 * of the main editor bundle while both PNG and PDF share one lazy chunk.
 */
export function downloadPdf(
  stage: Konva.Stage,
  filename: string,
  creationDate: Date,
  fileId: string,
): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
  const isLandscape = stage.width() > stage.height()

  // Cast: jsPDF types omit setCreationDate; the runtime has it.
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as JsPDFExt

  doc.setCreationDate(creationDate)
  doc.setFileId(fileId)

  // A4 in mm: portrait 210 × 297 mm, landscape 297 × 210 mm.
  const [pageW, pageH] = isLandscape ? [297, 210] : [210, 297]
  doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH)
  doc.save(filename)
}
