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
  const x = item.xMeters * PIXELS_PER_METER
  const y = item.yMeters * PIXELS_PER_METER
  const w = item.widthMeters * PIXELS_PER_METER
  const h = item.heightMeters * PIXELS_PER_METER

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    e.cancelBubble = true
    onSelect()
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>): void => {
    const newXMeters = Math.round(e.target.x() / PIXELS_PER_METER)
    const newYMeters = Math.round(e.target.y() / PIXELS_PER_METER)
    onMoveEnd(newXMeters, newYMeters)
  }

  return (
    <Group
      x={x}
      y={y}
      draggable={isSelected}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
    >
      {catalogItem.shape === 'circle' ? (
        <Circle
          x={w / 2}
          y={h / 2}
          radius={Math.min(w, h) / 2}
          fill={catalogItem.color}
          opacity={0.7}
          listening={false}
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
          listening={false}
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
