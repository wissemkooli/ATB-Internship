import type { DragEvent } from 'react'
import { BankCheck } from './shared-assets/check/check'
import type { Check } from '../types'

interface CheckPreviewProps {
  check: Check
  width?: number
  className?: string
  selected?: boolean
  onClick?: () => void
  onDragStart?: (check: Check) => void
  onDragEnd?: () => void
}

export function CheckPreview({
  check,
  width = 316,
  className,
  selected = false,
  onClick,
  onDragStart,
  onDragEnd,
}: CheckPreviewProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (!onDragStart) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(check.id))
    onDragStart(check)
  }

  return (
    <button
      type="button"
      className={['card-preview', selected ? 'is-active' : '', className ?? ''].filter(Boolean).join(' ')}
      draggable={Boolean(onDragStart)}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <BankCheck
        clientName={check.client_name}
        checkNumber={check.check_number}
        montant={check.montant}
        carnetSize={check.carnet_size}
        width={width}
      />
    </button>
  )
}
