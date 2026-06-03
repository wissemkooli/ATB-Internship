import type { ImgHTMLAttributes } from 'react'

type AtbLogoProps = ImgHTMLAttributes<HTMLImageElement>

export function AtbLogo({ className, alt = 'ATB', ...props }: AtbLogoProps) {
  return <img className={['atb-logo', className ?? ''].filter(Boolean).join(' ')} src="/atb-logo.png" alt={alt} draggable={false} {...props} />
}
