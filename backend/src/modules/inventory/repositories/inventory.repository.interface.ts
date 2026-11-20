import { Database } from 'better-sqlite3';
import { InventoryMovement } from '../domain/inventory-movement.entity.js';
import { UUID } from '../../../shared/types/branded.types.js';

export interface IInventoryRepository {
  recordMovement(movement: InventoryMovement, tx: Database): void;
  getHistoryByProductId(productId: UUID, limit?: number, tx?: Database): readonly InventoryMovement[];
}
