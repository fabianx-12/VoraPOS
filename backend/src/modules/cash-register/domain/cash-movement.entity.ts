import { UUID, Cents } from '../../../shared/types/branded.types.js';

export type CashMovementType = 'CASH_IN' | 'CASH_OUT';

export interface CashMovement {
  readonly id: UUID;
  readonly registerSessionId: UUID;
  readonly userId: UUID;
  readonly type: CashMovementType;
  readonly amount: Cents;
  readonly reason: string;
  readonly createdAt: string;
}
