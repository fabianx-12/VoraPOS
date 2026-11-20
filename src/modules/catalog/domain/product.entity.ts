import { UUID, Cents, SKU, Barcode } from '../../../shared/types/branded.types.js';

export interface Product {
  readonly id: UUID;
  readonly categoryId: UUID;
  readonly taxId: UUID;
  readonly sku: SKU;
  readonly barcode: Barcode | null;
  readonly name: string;
  readonly salePrice: Cents;
  readonly unitCost: Cents;
  readonly trackInventory: boolean;
  readonly currentStock: number;
  readonly minStock: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
