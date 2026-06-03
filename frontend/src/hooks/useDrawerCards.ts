import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Card, CardMovePayload } from '../types'

function sortCards(cards: Card[]) {
  return [...cards].sort((left, right) => {
    if (left.row !== right.row) {
      return left.row - right.row
    }

    if (left.col !== right.col) {
      return left.col - right.col
    }

    return left.order - right.order
  })
}

export function useDrawerCards(drawerId: number | null) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardsRef = useRef<Card[]>([])

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])

  useEffect(() => {
    let isActive = true

    if (drawerId === null) {
      setCards([])
      setLoading(false)
      setError(null)
      return () => {
        isActive = false
      }
    }

    setLoading(true)
    setError(null)

    void api
      .getDrawerCards(drawerId)
      .then((nextCards) => {
        if (!isActive) {
          return
        }

        setCards(sortCards(nextCards))
      })
      .catch((requestError) => {
        if (!isActive) {
          return
        }

        setError(
          requestError instanceof Error ? requestError.message : 'Unable to load cards',
        )
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [drawerId])

  const getCardById = useCallback(
    (cardId: number) => cardsRef.current.find((card) => card.id === cardId) ?? null,
    [],
  )

  const moveCard = useCallback(
    async (cardId: number, payload: CardMovePayload) => {
      const currentCards = cardsRef.current
      const targetIndex = currentCards.findIndex((card) => card.id === cardId)
      if (targetIndex === -1) {
        return null
      }

      const previousCards = currentCards
      const sourceCard = currentCards[targetIndex]
      const optimisticCard: Card = {
        ...sourceCard,
        ...payload,
      }

      setCards(sortCards(currentCards.map((card) => (card.id === cardId ? optimisticCard : card))))

      try {
        const updatedCard = await api.moveCard(cardId, payload)
        setCards((current) =>
          sortCards(current.map((card) => (card.id === cardId ? updatedCard : card))),
        )
        return updatedCard
      } catch (requestError) {
        setCards(previousCards)
        throw requestError
      }
    },
    [],
  )

  const deleteCard = useCallback(async (cardId: number) => {
    const previousCards = cardsRef.current
    setCards(previousCards.filter((card) => card.id !== cardId))

    try {
      await api.deleteCard(cardId)
      return true
    } catch (requestError) {
      setCards(previousCards)
      throw requestError
    }
  }, [])

  const cardsByCell = useMemo(() => {
    const grouped = new Map<string, Card[]>()

    for (const card of cards) {
      const key = `${card.row}:${card.col}`
      const bucket = grouped.get(key)

      if (bucket) {
        bucket.push(card)
      } else {
        grouped.set(key, [card])
      }
    }

    for (const bucket of grouped.values()) {
      bucket.sort((left, right) => left.order - right.order)
    }

    return grouped
  }, [cards])

  return {
    cards,
    cardsByCell,
    loading,
    error,
    getCardById,
    moveCard,
    deleteCard,
    setCards,
  }
}

