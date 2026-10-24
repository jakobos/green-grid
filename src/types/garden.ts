export type Layer = 1 | 2 | 3 | 4 | 5
export type NorthDeg = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315


export type ItemSymbol = 'tree' | 'shrub' | 'bed' | 'bulb' | 'groundcover' | 'herb' | 'vegetable'

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
  symbol: ItemSymbol
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
  northDeg: NorthDeg
  items: GardenItem[]
  createdAt: string
  updatedAt: string
}

export type Viewport = {
  x: number
  y: number
  scale: number
}
