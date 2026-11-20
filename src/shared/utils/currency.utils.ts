import { Cents, BasisPoints, toCents } from '../types/branded.types.js';

/**
 * Calculates line tax amount with integer half-up rounding.
 * Formula: round((subtotalCents * rateBps) / 10000)
 */
export function calculateTaxAmount(subtotalCents: Cents, rateBps: BasisPoints): Cents {
  if (rateBps === 0) return toCents(0);
  const tax = Math.round((subtotalCents * rateBps) / 10000);
  return toCents(tax);
}

/**
 * Extracts the net subtotal before tax from a tax-inclusive gross amount.
 * Formula: round((grossAmount * 10000) / (10000 + rateBps))
 */
export function extractNetFromGross(grossCents: Cents, rateBps: BasisPoints): Cents {
  if (rateBps === 0) return grossCents;
  const net = Math.round((grossCents * 10000) / (10000 + rateBps));
  return toCents(net);
}

/**
 * Formats integer cents into standard decimal fiat currency (e.g., 1050 cents -> "$10.50").
 */
export function formatCentsToCurrency(cents: Cents, currencySymbol = '$'): string {
  const isNegative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formattedRemainder = remainder.toString().padStart(2, '0');
  const sign = isNegative ? '-' : '';
  return `${sign}${currencySymbol}${dollars}.${formattedRemainder}`;
}
