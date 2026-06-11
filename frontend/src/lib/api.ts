import type { Card, CardCreate, CardMovePayload, Drawer, DrawerCreate, SearchResultCard } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const responseText = await response.text()
    let message = responseText

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as { detail?: unknown }
        if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
          message = parsed.detail
        }
      } catch {
        // Keep the raw body when it is not JSON.
      }
    }

    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  getDrawers: () => request<Drawer[]>('/drawers/'),
  createDrawer: (payload: DrawerCreate) =>
    request<Drawer>('/drawers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDrawerCards: (drawerId: number) => request<Card[]>(`/drawers/${drawerId}/cards`),
  searchCards: (query: string) =>
    request<Card[]>(`/cards/search?q=${encodeURIComponent(query)}`),
  addCard: (payload: CardCreate) =>
    request<Card>('/cards/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  moveCard: (cardId: number, payload: CardMovePayload) =>
    request<Card>(`/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCard: (cardId: number) =>
    request<{ message: string }>(`/cards/${cardId}`, {
      method: 'DELETE',
    }),
  highlightCompartment: (row: number, col: number) =>
    request<{ message: string }>('/hardware/highlight/compartment', {
      method: 'POST',
      body: JSON.stringify({ row, col }),
    }),
  highlightCard: (cardId: number) =>
    request<{ message: string }>(`/hardware/highlight/${cardId}`, {
      method: 'POST',
    }),
}

export function enrichSearchResults(cards: Card[], drawers: Drawer[]): SearchResultCard[] {
  const drawerNameById = new Map(drawers.map((drawer) => [drawer.id, drawer.name]))

  return cards.map((card) => ({
    ...card,
    drawer_name: drawerNameById.get(card.drawer_id) ?? `Drawer ${card.drawer_id}`,
  }))
}
