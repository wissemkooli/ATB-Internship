import type { CardType } from '../types'

export function formatCardNumber(cardNumber: string) {
  const digitsOnly = cardNumber.replace(/\D/g, '')
  const groupedDigits = digitsOnly.match(/.{1,4}/g)

  return groupedDigits?.join(' ') ?? digitsOnly
}

export function formatCardExpiration(expirationDate: string) {
  if (!expirationDate) {
    return '--/--'
  }

  const [year, month] = expirationDate.split('-')
  if (!year || !month) {
    return expirationDate
  }

  return `${month}/${year.slice(-2)}`
}

export function getCardCompanyLabel(cardType: CardType) {
  return cardType === 'visa' ? 'VISA' : 'MASTERCARD'
}

export function getCardTemplateType(cardType: CardType) {
  return cardType === 'visa' ? 'brand-light' : 'brand-dark'
}
