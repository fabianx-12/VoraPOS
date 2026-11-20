import { Database } from 'better-sqlite3';
import { IInventoryRepository } from './inventory.repository.interface.js';
import { InventoryMovement, InventoryMovementType } from '../domain/inventory-movement.entity.js';
import { UUID, toUUID } from '../../../shared/types/branded.types.js';

export class SQLiteInventoryRepository implements IInventoryRepository {
  constructor(private readonly db: Database) {}

  public recordMovement(movement: InventoryMovement, tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO inventory_movements (
        id, product_id, user_id, type, quantity_delta, resulting_stock, reference_id, notes, created_at
      ) VALUES (
        @id, @productId, @userId, @type, @quantityDelta, @resultingStock, @referenceId, @notes, @createdAt
      )
    `);

    stmt.run({
      id: movement.id,
      productId: movement.productId,
      userId: movement.userId,
      type: movement.type,
      quantityDelta: movement.quantityDelta,
      resultingStock: movement.resultingStock,
      referenceId: movement.referenceId,
      notes: movement.notes,
      createdAt: movement.createdAt,
    });
  }

  public getHistoryByProductId(productId: UUID, limit = 50, tx?: Database): readonly InventoryMovement[] {
    const conn = tx ?? this.db;
    const rows = conn
      .prepare(`
        SELECT * FROM inventory_movements
        WHERE product_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(productId, limit) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: toUUID(r['id'] as string),
      productId: toUUID(r['product_id'] as string),
      userId: toUUID(r['user_id'] as string),
      type: r['type'] as InventoryMovementType,
      quantityDelta: r['quantity_delta'] as number,
      resultingStock: r['resulting_stock'] as number,
      referenceId: (r['reference_id'] as string) || null,
      notes: (r['notes'] as string) || null,
      createdAt: r['created_at'] as string,
    }));
  }
}
