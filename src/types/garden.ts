// Item shape is defined in slice 2; no items are rendered in this slice.
export type GardenItem = {
  id: string
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
