export type CardType = 'visa' | 'mastercard'
export type CarnetSize = '25' | '50'
export type DrawerType = 'cards' | 'checks'

export interface Drawer {
  id: number
  name: string
  rows: number
  cols: number
  drawer_type: DrawerType
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
  drawer_type: DrawerType
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

export interface CheckCreate {
  check_number: string
  montant: number
  carnet_size: CarnetSize
  client_name: string
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface Check {
  id: number
  check_number: string
  montant: number
  carnet_size: CarnetSize
  client_name: string
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface CheckMovePayload {
  row: number
  col: number
  order: number
  drawer_id: number
}

export interface SearchResultCheck extends Check {
  drawer_name: string
}

export type DrawerItem = Card | Check
export type SearchResultItem = SearchResultCard | SearchResultCheck

export function isCheck(item: DrawerItem | SearchResultItem): item is Check | SearchResultCheck {
  return 'check_number' in item
}

export interface GridCell {
  row: number
  col: number
  key: string
}

export const cellKey = (row: number, col: number) => `${row}:${col}`
