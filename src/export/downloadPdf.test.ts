import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── jspdf mock ────────────────────────────────────────────────────────────────

const jsPDFMocks = vi.hoisted(() => {
  const instance = {
    addImage: vi.fn(),
    save: vi.fn(),
    setFileId: vi.fn(),
    setCreationDate: vi.fn(),
  }
  const JsPDF = vi.fn(() => instance)
  return { instance, JsPDF }
})

vi.mock('jspdf', () => ({ jsPDF: jsPDFMocks.JsPDF }))

// ── helpers ───────────────────────────────────────────────────────────────────

function fakeStage(width: number, height: number, tag = 'img') {
  return {
    toDataURL: vi.fn(() => `data:image/png;base64,${tag}`),
    width: vi.fn(() => width),
    height: vi.fn(() => height),
    destroy: vi.fn(),
  }
}

const PORTRAIT_DATE = new Date('2024-06-15T12:00:00.000Z')
const FILE_ID = 'abcd1234abcd1234abcd1234abcd1234'

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('downloadPdf', () => {
  it('creates a portrait jsPDF for a stage taller than it is wide', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const stage = fakeStage(2480, 3508) // portrait
    downloadPdf(stage as never, 'out.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.JsPDF).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'portrait', unit: 'mm', format: 'a4' }),
    )
  })

  it('creates a landscape jsPDF for a stage wider than it is tall', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const stage = fakeStage(3508, 2480) // landscape
    downloadPdf(stage as never, 'out.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.JsPDF).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'landscape' }),
    )
  })

  it('places the PNG at 0,0 filling a portrait A4 page (210 × 297 mm)', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const stage = fakeStage(2480, 3508, 'PORTDATA')
    downloadPdf(stage as never, 'out.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.instance.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,PORTDATA',
      'PNG',
      0,
      0,
      210,
      297,
      undefined,
      'FAST',
    )
  })

  it('places the PNG at 0,0 filling a landscape A4 page (297 × 210 mm)', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const stage = fakeStage(3508, 2480, 'LANDDATA')
    downloadPdf(stage as never, 'out.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.instance.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,LANDDATA',
      'PNG',
      0,
      0,
      297,
      210,
      undefined,
      'FAST',
    )
  })

  it('passes the filename to save', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    downloadPdf(fakeStage(2480, 3508) as never, 'my-garden.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.instance.save).toHaveBeenCalledWith('my-garden.pdf')
  })

  it('sets creation date from the supplied Date for determinism', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const date = new Date('2025-03-01T08:00:00.000Z')
    downloadPdf(fakeStage(2480, 3508) as never, 'g.pdf', date, FILE_ID)
    expect(jsPDFMocks.instance.setCreationDate).toHaveBeenCalledWith(date)
  })

  it('sets the file ID for determinism', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    downloadPdf(fakeStage(2480, 3508) as never, 'g.pdf', PORTRAIT_DATE, FILE_ID)
    expect(jsPDFMocks.instance.setFileId).toHaveBeenCalledWith(FILE_ID)
  })

  it('rasterises the stage at pixelRatio 1', async () => {
    const { downloadPdf } = await import('./downloadPdf')
    const stage = fakeStage(2480, 3508)
    downloadPdf(stage as never, 'g.pdf', PORTRAIT_DATE, FILE_ID)
    expect(stage.toDataURL).toHaveBeenCalledWith({ pixelRatio: 1, mimeType: 'image/png' })
  })
})
