declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * RFC 4122 Canonical UUID String (v4 or v7)
 */
export type UUID = Brand<string, 'UUID'>;

export function toUUID(value: string): UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new TypeError(`Invalid UUID format: "${value}"`);
  }
  return value as UUID;
}

/**
 * Monetary value stored in the smallest currency unit (e.g. cents)
 */
export type Cents = Brand<number, 'Cents'>;

export function toCents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Monetary value must be an integer (received: ${value})`);
  }
  return value as Cents;
}

/**
 * Tax rate stored in Basis Points (1 bps = 0.01%, 1900 bps = 19.00%)
 */
export type BasisPoints = Brand<number, 'BasisPoints'>;

export function toBasisPoints(value: number): BasisPoints {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`Basis points must be a non-negative integer (received: ${value})`);
  }
  return value as BasisPoints;
}

/**
 * Internal Stock Keeping Unit code
 */
export type SKU = Brand<string, 'SKU'>;

export function toSKU(value: string): SKU {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new TypeError('SKU cannot be empty');
  }
  return trimmed as SKU;
}

/**
 * Barcode EAN-13, UPC-A, Code-128
 */
export type Barcode = Brand<string, 'Barcode'>;

export function toBarcode(value: string): Barcode {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new TypeError('Barcode cannot be empty');
  }
  return trimmed as Barcode;
}
