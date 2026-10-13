export type Layer = 1 | 2 | 3 | 4 | 5

export type CatalogItem = {
  catalogId: string
  name: string
  description: string
  layer: Layer
  defaultWidthMeters: number
  defaultHeightMeters: number
  shape: 'rect' | 'circle'
  color: string
  estimatedCostEur: number
}

export type GardenItem = {
  id: string
  catalogId: string
  xMeters: number
  yMeters: number
  widthMeters: number
  heightMeters: number
  rotationDeg: number
}

export type Garden = {
  id: string
  name: string
  widthMeters: number
  heightMeters: number
  items: GardenItem[]
  createdAt: string
  updatedAt: string
}

export type Viewport = {
  x: number
  y: number
  scale: number
}
