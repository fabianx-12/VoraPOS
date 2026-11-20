import { UUID } from '../../../shared/types/branded.types.js';

export type InventoryMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'SHRINKAGE';

export interface InventoryMovement {
  readonly id: UUID;
  readonly productId: UUID;
  readonly userId: UUID;
  readonly type: InventoryMovementType;
  readonly quantityDelta: number;
  readonly resultingStock: number;
  readonly referenceId: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
}
