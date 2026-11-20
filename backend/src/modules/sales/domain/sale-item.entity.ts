import { UUID, Cents } from '../../../shared/types/branded.types.js';

export interface SaleItem {
  readonly id: UUID;
  readonly saleId: UUID;
  readonly productId: UUID;
  readonly quantity: number;
  readonly unitPrice: Cents;
  readonly lineDiscount: Cents;
  readonly taxAmount: Cents;
  readonly lineTotal: Cents;
}
