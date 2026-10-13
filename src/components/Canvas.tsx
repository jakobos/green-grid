import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useGardenStore } from '@/store/garden'
import { Grid } from './Grid'

const ZOOM_SENSITIVITY = 0.001
const MIN_SCALE = 0.1
const MAX_SCALE = 5.0

export function Canvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const { viewport, setViewport, garden } = useGardenStore()

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

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setViewport({
        x: e.target.x(),
        y: e.target.y(),
        scale: viewport.scale,
      })
    },
    [viewport.scale, setViewport]
  )

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden">
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
          onDragEnd={handleDragEnd}
        >
          <Layer>
            <Grid
              widthMeters={garden.widthMeters}
              heightMeters={garden.heightMeters}
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
}
