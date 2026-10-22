import { Rect, Circle, Text, Group } from 'react-konva'
import type Konva from 'konva'
import type { GardenItem, CatalogItem } from '@/types/garden'
import { PIXELS_PER_METER } from './Grid'

type GardenItemShapeProps = {
  item: GardenItem
  catalogItem: CatalogItem
  isSelected: boolean
  onSelect: () => void
  onMoveEnd: (xMeters: number, yMeters: number) => void
}

export function GardenItemShape({
  item,
  catalogItem,
  isSelected,
  onSelect,
  onMoveEnd,
}: GardenItemShapeProps): JSX.Element {
  const w = item.widthMeters * PIXELS_PER_METER
  const h = item.heightMeters * PIXELS_PER_METER

  // Position the group so its center is at (xMeters*PPM + w/2, yMeters*PPM + h/2).
  // offsetX/offsetY shift the rotation anchor to the center; the visual top-left
  // stays at (xMeters*PPM, yMeters*PPM) regardless of rotation.
  const cx = item.xMeters * PIXELS_PER_METER + w / 2
  const cy = item.yMeters * PIXELS_PER_METER + h / 2

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
    e.cancelBubble = true
    onSelect()
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>): void => {
    // e.target.x() is the center x after drag; convert back to top-left meters
    const newXMeters = Math.round((e.target.x() - w / 2) / PIXELS_PER_METER)
    const newYMeters = Math.round((e.target.y() - h / 2) / PIXELS_PER_METER)
    onMoveEnd(newXMeters, newYMeters)
  }

  return (
    <Group
      x={cx}
      y={cy}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={item.rotationDeg}
      draggable={isSelected}
      onClick={handleSelect}
      onTap={handleSelect}
    >
      {catalogItem.shape === 'circle' ? (
        <Circle
          x={w / 2}
          y={h / 2}
          radius={Math.min(w, h) / 2}
          fill={catalogItem.color}
          opacity={0.7}
        />
      ) : (
        <Rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={catalogItem.color}
          opacity={0.7}
          cornerRadius={3}
        />
      )}
      <Text
        x={0}
        y={h / 2 - 6}
        width={w}
        text={catalogItem.name}
        fontSize={11}
        fontFamily="sans-serif"
        fill="#fff"
        align="center"
        listening={false}
      />
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={w + 4}
          height={h + 4}
          stroke="#2563eb"
          strokeWidth={2}
          fill="transparent"
          listening={false}
          data-testid="selection-border"
        />
      )}
    </Group>
  )
}
