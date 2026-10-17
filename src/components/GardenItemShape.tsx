import { Rect, Circle, Text, Group } from 'react-konva'
import type { GardenItem, CatalogItem } from '@/types/garden'
import { PIXELS_PER_METER } from './Grid'

type GardenItemShapeProps = {
  item: GardenItem
  catalogItem: CatalogItem
}

export function GardenItemShape({ item, catalogItem }: GardenItemShapeProps): JSX.Element {
  const x = item.xMeters * PIXELS_PER_METER
  const y = item.yMeters * PIXELS_PER_METER
  const w = item.widthMeters * PIXELS_PER_METER
  const h = item.heightMeters * PIXELS_PER_METER

  return (
    <Group x={x} y={y} data-item-id={item.id}>
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
    </Group>
  )
}
