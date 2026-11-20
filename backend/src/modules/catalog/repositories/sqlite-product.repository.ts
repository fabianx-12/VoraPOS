import { Database } from 'better-sqlite3';
import { IProductRepository } from './product.repository.interface.js';
import { Product } from '../domain/product.entity.js';
import { UUID, toUUID, toCents, toSKU, toBarcode, Barcode, SKU } from '../../../shared/types/branded.types.js';

export class SQLiteProductRepository implements IProductRepository {
  constructor(private readonly db: Database) {}

  public findById(id: UUID, tx?: Database): Product | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    return row ? this.mapRowToProduct(row) : null;
  }

  public findByBarcode(barcode: Barcode, tx?: Database): Product | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT * FROM products WHERE barcode = ? AND is_active = 1')
      .get(barcode) as Record<string, unknown> | undefined;

    return row ? this.mapRowToProduct(row) : null;
  }

  public findBySku(sku: SKU, tx?: Database): Product | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT * FROM products WHERE sku = ? AND is_active = 1')
      .get(sku) as Record<string, unknown> | undefined;

    return row ? this.mapRowToProduct(row) : null;
  }

  public decrementStock(productId: UUID, quantity: number, tx: Database): number {
    tx.prepare(`
      UPDATE products
      SET current_stock = current_stock - ?,
          updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
      WHERE id = ?
    `).run(quantity, productId);

    const row = tx
      .prepare('SELECT current_stock FROM products WHERE id = ?')
      .get(productId) as { current_stock: number };

    return row.current_stock;
  }

  public incrementStock(productId: UUID, quantity: number, tx: Database): number {
    tx.prepare(`
      UPDATE products
      SET current_stock = current_stock + ?,
          updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
      WHERE id = ?
    `).run(quantity, productId);

    const row = tx
      .prepare('SELECT current_stock FROM products WHERE id = ?')
      .get(productId) as { current_stock: number };

    return row.current_stock;
  }

  public save(product: Product, tx?: Database): void {
    const conn = tx ?? this.db;
    conn.prepare(`
      INSERT INTO products (
        id, category_id, tax_id, sku, barcode, name,
        sale_price, unit_cost, track_inventory, current_stock, min_stock, is_active, created_at, updated_at
      ) VALUES (
        @id, @categoryId, @taxId, @sku, @barcode, @name,
        @salePrice, @unitCost, @trackInventory, @currentStock, @minStock, @isActive, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        tax_id = excluded.tax_id,
        sku = excluded.sku,
        barcode = excluded.barcode,
        name = excluded.name,
        sale_price = excluded.sale_price,
        unit_cost = excluded.unit_cost,
        track_inventory = excluded.track_inventory,
        current_stock = excluded.current_stock,
        min_stock = excluded.min_stock,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `).run({
      id: product.id,
      categoryId: product.categoryId,
      taxId: product.taxId,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      salePrice: product.salePrice,
      unitCost: product.unitCost,
      trackInventory: product.trackInventory ? 1 : 0,
      currentStock: product.currentStock,
      minStock: product.minStock,
      isActive: product.isActive ? 1 : 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  private mapRowToProduct(row: Record<string, unknown>): Product {
    return {
      id: toUUID(row['id'] as string),
      categoryId: toUUID(row['category_id'] as string),
      taxId: toUUID(row['tax_id'] as string),
      sku: toSKU(row['sku'] as string),
      barcode: row['barcode'] ? toBarcode(row['barcode'] as string) : null,
      name: row['name'] as string,
      salePrice: toCents(row['sale_price'] as number),
      unitCost: toCents(row['unit_cost'] as number),
      trackInventory: Boolean(row['track_inventory']),
      currentStock: row['current_stock'] as number,
      minStock: row['min_stock'] as number,
      isActive: Boolean(row['is_active']),
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }
}
