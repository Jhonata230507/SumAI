import { describe, expect, it } from 'vitest'
import { formatAmountInput, parseCurrency } from '../format-currency'

describe('formatAmountInput', () => {
  it('groups COP with dots and no decimals', () => {
    expect(formatAmountInput('400000000', 'COP')).toBe('400.000.000')
    expect(formatAmountInput('1500', 'COP')).toBe('1.500')
    expect(formatAmountInput('999', 'COP')).toBe('999')
    // Separators typed by hand are redone; COP has no decimals.
    expect(formatAmountInput('4.0000.00', 'COP')).toBe('4.000.000')
  })

  it('groups USD with commas and keeps up to two decimals', () => {
    expect(formatAmountInput('420000', 'USD')).toBe('420,000')
    expect(formatAmountInput('1234.5', 'USD')).toBe('1,234.5')
    expect(formatAmountInput('1234.567', 'USD')).toBe('1,234.56')
    expect(formatAmountInput('1234.', 'USD')).toBe('1,234.')
    expect(formatAmountInput('.5', 'USD')).toBe('0.5')
  })

  it('drops leading zeros and anything that is not part of a number', () => {
    expect(formatAmountInput('000123', 'USD')).toBe('123')
    expect(formatAmountInput('$ 12a34', 'USD')).toBe('1,234')
    expect(formatAmountInput('', 'COP')).toBe('')
  })

  it('round-trips through the parser', () => {
    expect(parseCurrency(formatAmountInput('400000000', 'COP'), 'COP')).toBe(400_000_000)
    expect(parseCurrency(formatAmountInput('1234.5', 'USD'), 'USD')).toBe(1234.5)
  })
})
