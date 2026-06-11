export type CardType = 'visa' | 'mastercard'

export interface Drawer {
  id: number
  name: string
  rows: number
  cols: number
}

export interface CardCreate {
  cardholder_name: string
  card_number: string
  expiration_date: string
  card_type: CardType
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface Card {
  id: number
  cardholder_name: string
  card_number: string
  expiration_date: string
  card_type: CardType
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface DrawerCreate {
  name: string
  rows: number
  cols: number
}

export interface CardMovePayload {
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface SearchResultCard extends Card {
  drawer_name: string
}

export interface GridCell {
  row: number
  col: number
  key: string
}

export const cellKey = (row: number, col: number) => `${row}:${col}`

