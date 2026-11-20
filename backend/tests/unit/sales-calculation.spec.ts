import { describe, it, expect } from 'vitest';
import {
  calculateTaxAmount,
  extractNetFromGross,
  formatCentsToCurrency,
} from '../../src/shared/utils/currency.utils.js';
import { toCents, toBasisPoints } from '../../src/shared/types/branded.types.js';

describe('Financial Arithmetic & Tax Calculations (Integer Precision)', () => {
  it('should accurately calculate tax amount in cents using basis points (1900 bps = 19%)', () => {
    // $10.00 subtotal (1000 cents) at 19% VAT -> $1.90 (190 cents)
    const subtotal = toCents(1000);
    const taxRate = toBasisPoints(1900);
    const tax = calculateTaxAmount(subtotal, taxRate);

    expect(tax).toBe(190);
  });

  it('should handle 0% tax (exempt staple goods)', () => {
    const subtotal = toCents(450);
    const taxRate = toBasisPoints(0);
    const tax = calculateTaxAmount(subtotal, taxRate);

    expect(tax).toBe(0);
  });

  it('should extract net subtotal from gross amount without floating-point errors', () => {
    // $1.50 gross (150 cents) with 19% VAT included
    // Net = round(150 * 10000 / 11900) = 126 cents ($1.26 net, $0.24 tax)
    const gross = toCents(150);
    const taxRate = toBasisPoints(1900);
    const net = extractNetFromGross(gross, taxRate);

    expect(net).toBe(126);
    expect(calculateTaxAmount(net, taxRate)).toBe(24);
    expect(net + calculateTaxAmount(net, taxRate)).toBe(150);
  });

  it('should format cents into clean fiat currency strings', () => {
    expect(formatCentsToCurrency(toCents(1050))).toBe('$10.50');
    expect(formatCentsToCurrency(toCents(99))).toBe('$0.99');
    expect(formatCentsToCurrency(toCents(0))).toBe('$0.00');
    expect(formatCentsToCurrency(toCents(-250))).toBe('-$2.50');
  });
});
