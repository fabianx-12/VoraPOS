import { Database } from 'better-sqlite3';
import { Product } from '../domain/product.entity.js';
import { UUID, Barcode, SKU } from '../../../shared/types/branded.types.js';

export interface IProductRepository {
  findById(id: UUID, tx?: Database): Product | null;
  findByBarcode(barcode: Barcode, tx?: Database): Product | null;
  findBySku(sku: SKU, tx?: Database): Product | null;
  decrementStock(productId: UUID, quantity: number, tx: Database): number; // Returns resulting stock
  incrementStock(productId: UUID, quantity: number, tx: Database): number; // Returns resulting stock
  save(product: Product, tx?: Database): void;
}
