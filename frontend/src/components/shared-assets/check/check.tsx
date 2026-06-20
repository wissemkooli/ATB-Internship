import { useMemo } from 'react'
import type { CarnetSize } from '../../../types'
import { cx } from '../../../utils/cx'

interface BankCheckProps {
  clientName?: string
  checkNumber?: string
  montant?: number
  carnetSize?: CarnetSize
  className?: string
  width?: number
}

const calculateScale = (desiredWidth: number, originalWidth: number, originalHeight: number) => {
  const scale = desiredWidth / originalWidth
  const scaledWidth = originalWidth * scale
  const scaledHeight = originalHeight * scale

  return {
    scale: scale.toFixed(4),
    scaledWidth: scaledWidth.toFixed(2),
    scaledHeight: scaledHeight.toFixed(2),
  }
}

const formatMontant = (value: number) =>
  new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export const BankCheck = ({
  clientName = 'Client ATB',
  checkNumber = '000000',
  montant = 0,
  carnetSize = '25',
  className,
  width,
}: BankCheckProps) => {
  const originalWidth = 316
  const originalHeight = 190

  const { scale, scaledWidth, scaledHeight } = useMemo(() => {
    if (!width) {
      return {
        scale: 1,
        scaledWidth: originalWidth,
        scaledHeight: originalHeight,
      }
    }

    return calculateScale(width, originalWidth, originalHeight)
  }, [width])

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
      className={cx('relative flex', className)}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
          background: '#ffffff',
        }}
        className="absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden rounded-[24px] border border-[#D6C47A] text-left"
      >
        <div className="flex h-[34px] items-center justify-between bg-[#DC135C] px-4 text-white">
          <span className="text-[18px] leading-none font-bold">ATB</span>
          <span className="text-[12px] leading-none font-bold tracking-[0.08em]">CHEQUE</span>
        </div>

        <div className="flex flex-1 flex-col justify-between px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
              A L'ORDRE DE
            </span>
            <span className="text-[9px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
              MONTANT
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[14px] leading-tight font-semibold text-black">
              {clientName}
            </span>
            <span className="shrink-0 text-[14px] leading-tight font-semibold text-[#DC135C]">
              {formatMontant(montant)} TND
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 text-[10px] leading-none text-neutral-500">
            <span className="min-w-0 truncate">N {checkNumber}</span>
            <span className="shrink-0">{carnetSize} cheques</span>
          </div>
        </div>
      </div>
    </div>
  )
}
