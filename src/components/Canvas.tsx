import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useGardenStore } from '@/store/garden'
import { Grid, PIXELS_PER_METER } from './Grid'
import { GardenItemShape } from './GardenItemShape'
import { CATALOG } from '@/data/catalog'
import type { Layer as GardenLayer } from '@/types/garden'

const ZOOM_SENSITIVITY = 0.001
const MIN_SCALE = 0.1
const MAX_SCALE = 5.0

const GARDEN_LAYERS: GardenLayer[] = [1, 2, 3, 4, 5]

// Static lookup: catalogId → CatalogItem
const CATALOG_RECORD: Record<string, (typeof CATALOG)[number]> = Object.fromEntries(
  CATALOG.map((c) => [c.catalogId, c])
)

export function Canvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const { viewport, setViewport, garden, addItem, selectedItemId, selectItem, clearSelection, moveItem, rotateItem, deleteItem, undo, redo } =
    useGardenStore()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }
      if (!selectedItemId) return
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        rotateItem(selectedItemId)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteItem(selectedItemId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItemId, rotateItem, deleteItem, undo, redo])

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = e.target.getStage()
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const delta = -e.evt.deltaY * ZOOM_SENSITIVITY
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale + delta))
      const scaleFactor = newScale / viewport.scale

      setViewport({
        x: pointer.x - (pointer.x - viewport.x) * scaleFactor,
        y: pointer.y - (pointer.y - viewport.y) * scaleFactor,
        scale: newScale,
      })
    },
    [viewport, setViewport]
  )

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setViewport({
        x: e.target.x(),
        y: e.target.y(),
        scale: viewport.scale,
      })
    },
    [viewport.scale, setViewport]
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only deselect when clicking the Stage background (no bubbled item click)
      if (e.target === e.target.getStage()) {
        clearSelection()
      }
    },
    [clearSelection]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const catalogId = e.dataTransfer.getData('application/x-catalog-id')
      const catalogItem = CATALOG_RECORD[catalogId]
      if (!catalogItem || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const stageX = e.clientX - rect.left
      const stageY = e.clientY - rect.top

      // Invert the viewport transform: stage coords → garden coords
      const gardenPixelX = (stageX - viewport.x) / viewport.scale
      const gardenPixelY = (stageY - viewport.y) / viewport.scale

      const xMeters = Math.round(gardenPixelX / PIXELS_PER_METER)
      const yMeters = Math.round(gardenPixelY / PIXELS_PER_METER)

      addItem({ catalogItem, xMeters, yMeters })
    },
    [viewport, addItem]
  )

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid="canvas-container"
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable
          onWheel={handleWheel}
          onDragEnd={handleStageDragEnd}
          onClick={handleStageClick}
        >
          {/* Grid layer — always below garden items */}
          <Layer>
            <Grid
              widthMeters={garden.widthMeters}
              heightMeters={garden.heightMeters}
            />
          </Layer>

          {/* One Layer per garden layer, bottom (1) to top (5) */}
          {GARDEN_LAYERS.map((layerNum) => {
            const layerItems = garden.items.filter((item) => {
              const cat = CATALOG_RECORD[item.catalogId]
              return cat?.layer === layerNum
            })
            return (
              <Layer key={layerNum} data-layer={layerNum}>
                {layerItems.map((item) => {
                  const cat = CATALOG_RECORD[item.catalogId]
                  if (!cat) return null
                  return (
                    <GardenItemShape
                      key={item.id}
                      item={item}
                      catalogItem={cat}
                      isSelected={selectedItemId === item.id}
                      onSelect={() => selectItem(item.id)}
                      onMoveEnd={(xMeters, yMeters) => moveItem(item.id, xMeters, yMeters)}
                    />
                  )
                })}
              </Layer>
            )
          })}
        </Stage>
      )}
    </div>
  )
}
