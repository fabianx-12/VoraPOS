import { UUID, Cents } from '../../../shared/types/branded.types.js';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface SalePayment {
  readonly id: UUID;
  readonly saleId: UUID;
  readonly method: PaymentMethod;
  readonly amount: Cents;
  readonly transactionReference: string | null;
  readonly createdAt: string;
}
