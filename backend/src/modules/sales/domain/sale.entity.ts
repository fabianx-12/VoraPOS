import { UUID, Cents } from '../../../shared/types/branded.types.js';
import { SaleItem } from './sale-item.entity.js';
import { SalePayment } from './sale-payment.entity.js';

export type SaleStatus = 'COMPLETED' | 'VOIDED';

export interface Sale {
  readonly id: UUID;
  readonly receiptNumber: string;
  readonly registerSessionId: UUID;
  readonly userId: UUID;
  readonly customerId: UUID | null;
  readonly subtotal: Cents;
  readonly discountTotal: Cents;
  readonly taxTotal: Cents;
  readonly total: Cents;
  readonly status: SaleStatus;
  readonly voidReason: string | null;
  readonly voidedByUserId: UUID | null;
  readonly createdAt: string;
  readonly voidedAt: string | null;
  readonly items?: readonly SaleItem[];
  readonly payments?: readonly SalePayment[];
}
