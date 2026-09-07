export interface Location {
  lat: number
  lng: number
  label: string
}

export interface Activity {
  id: string
  name: string
  description: string
  imageUrl?: string
  location: Location
  groupId?: string
}

export interface Group {
  id: string
  name: string
  color: string
}

export interface Day {
  index: number
  date: string // ISO yyyy-mm-dd
  groupId?: string
}

export interface Trip {
  startDate: string // ISO yyyy-mm-dd
  days: Day[]
  activities: Activity[]
  groups: Group[]
}

export const GROUP_COLORS = [
  '#e6194b',
  '#3cb44b',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#fabed4',
  '#469990',
  '#dcbeff',
  '#9a6324',
  '#800000',
  '#aaffc3',
  '#808000',
  '#000075',
]

export const UNGROUPED_COLOR = '#888888'
