import { UUID, Cents } from '../../../shared/types/branded.types.js';

export type RegisterSessionStatus = 'OPEN' | 'CLOSED';

export interface RegisterSession {
  readonly id: UUID;
  readonly registerId: UUID;
  readonly openedByUserId: UUID;
  readonly closedByUserId: UUID | null;
  readonly openingAmount: Cents;
  readonly expectedCashAmount: Cents | null;
  readonly declaredCashAmount: Cents | null;
  readonly cashDifference: Cents | null;
  readonly status: RegisterSessionStatus;
  readonly openedAt: string;
  readonly closedAt: string | null;
}
