import { Line, Rect } from 'react-konva'

export const PIXELS_PER_METER = 60

type GridProps = {
  widthMeters: number
  heightMeters: number
}

export function Grid({ widthMeters, heightMeters }: GridProps): JSX.Element {
  const canvasWidth = widthMeters * PIXELS_PER_METER
  const canvasHeight = heightMeters * PIXELS_PER_METER

  const verticalLines: JSX.Element[] = []
  for (let col = 0; col <= widthMeters; col++) {
    const x = col * PIXELS_PER_METER
    verticalLines.push(
      <Line
        key={`v${col}`}
        points={[x, 0, x, canvasHeight]}
        stroke="#d1d5db"
        strokeWidth={1}
        listening={false}
      />
    )
  }

  const horizontalLines: JSX.Element[] = []
  for (let row = 0; row <= heightMeters; row++) {
    const y = row * PIXELS_PER_METER
    horizontalLines.push(
      <Line
        key={`h${row}`}
        points={[0, y, canvasWidth, y]}
        stroke="#d1d5db"
        strokeWidth={1}
        listening={false}
      />
    )
  }

  return (
    <>
      {verticalLines}
      {horizontalLines}
      <Rect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        stroke="#374151"
        strokeWidth={2}
        fill="transparent"
        listening={false}
      />
    </>
  )
}
