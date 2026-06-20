import type {
  Card,
  CardCreate,
  CardMovePayload,
  Check,
  CheckCreate,
  CheckMovePayload,
  Drawer,
  DrawerCreate,
  SearchResultCard,
  SearchResultCheck,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const STORAGE_KEY_TOKEN = 'atb_auth_token'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem(STORAGE_KEY_TOKEN)
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
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
  getDrawerChecks: (drawerId: number) => request<Check[]>(`/drawers/${drawerId}/checks`),
  searchCards: (query: string) =>
    request<Card[]>(`/cards/search?q=${encodeURIComponent(query)}`),
  searchChecks: (query: string) =>
    request<Check[]>(`/checks/search?q=${encodeURIComponent(query)}`),
  getCheck: (checkId: number) => request<Check>(`/checks/${checkId}`),
  addCard: (payload: CardCreate) =>
    request<Card>('/cards/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addCheck: (payload: CheckCreate) =>
    request<Check>('/checks/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  moveCard: (cardId: number, payload: CardMovePayload) =>
    request<Card>(`/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  moveCheck: (checkId: number, payload: CheckMovePayload) =>
    request<Check>(`/checks/${checkId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCard: (cardId: number) =>
    request<{ message: string }>(`/cards/${cardId}`, {
      method: 'DELETE',
    }),
  deleteCheck: (checkId: number) =>
    request<void>(`/checks/${checkId}`, {
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

export function enrichCheckSearchResults(checks: Check[], drawers: Drawer[]): SearchResultCheck[] {
  const drawerNameById = new Map(drawers.map((drawer) => [drawer.id, drawer.name]))

  return checks.map((check) => ({
    ...check,
    drawer_name: drawerNameById.get(check.drawer_id) ?? `Drawer ${check.drawer_id}`,
  }))
}
