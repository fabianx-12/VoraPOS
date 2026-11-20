import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DatabaseConstructor, { Database } from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { SQLiteUnitOfWork } from '../../src/shared/database/unit-of-work.js';
import { SQLiteSaleRepository } from '../../src/modules/sales/repositories/sqlite-sale.repository.js';
import { SQLiteProductRepository } from '../../src/modules/catalog/repositories/sqlite-product.repository.js';
import { SQLiteInventoryRepository } from '../../src/modules/inventory/repositories/sqlite-inventory.repository.js';
import { SQLiteRegisterSessionRepository } from '../../src/modules/cash-register/repositories/sqlite-register-session.repository.js';
import { SQLiteSyncOutboxRepository } from '../../src/modules/sync/repositories/sqlite-sync-outbox.repository.js';
import { SQLiteFiscalQueueAdapter } from '../../src/modules/fiscal/adapters/fiscal-queue.adapter.js';
import { EscPosReceiptPrinterAdapter } from '../../src/infrastructure/hardware/escpos-printer.adapter.js';
import { CreateSaleUseCase } from '../../src/modules/sales/use-cases/create-sale.use-case.js';
import { toUUID } from '../../src/shared/types/branded.types.js';
import { InsufficientStockError, InvalidPaymentTotalError } from '../../src/shared/errors/domain.error.js';

describe('CreateSaleUseCase Integration with Atomic SQLite UnitOfWork', () => {
  let db: Database;
  let createSaleUseCase: CreateSaleUseCase;
  let productRepo: SQLiteProductRepository;
  let outboxRepo: SQLiteSyncOutboxRepository;

  const sessionId = toUUID('rs000001-0000-4000-8000-000000000001');
  const userId = toUUID('u0000001-0000-4000-8000-000000000001');
  const productId = toUUID('p0000001-0000-4000-8000-000000000001');

  beforeEach(() => {
    // 1. In-memory SQLite instance with full foreign key and WAL simulation
    db = new DatabaseConstructor(':memory:');
    db.pragma('foreign_keys = ON');

    // 2. Load schema and seed migrations
    const schemaSql = readFileSync('database/sqlite/migrations/v1.0.0_initial_schema.sql', 'utf-8');
    const seedSql = readFileSync('database/sqlite/seeds/master_seed.sql', 'utf-8');
    db.exec(schemaSql);
    db.exec(seedSql);

    // 3. Open a test register session
    db.prepare(`
      INSERT INTO register_sessions (
        id, register_id, opened_by_user_id, opening_amount, status, opened_at
      ) VALUES (
        ?, 'r0000001-0000-4000-8000-000000000001', ?, 10000, 'OPEN', '2026-11-20T00:00:00.000Z'
      )
    `).run(sessionId, userId);

    // 4. Wire domain dependencies
    const uow = new SQLiteUnitOfWork(db);
    const saleRepo = new SQLiteSaleRepository(db);
    productRepo = new SQLiteProductRepository(db);
    const inventoryRepo = new SQLiteInventoryRepository(db);
    const sessionRepo = new SQLiteRegisterSessionRepository(db);
    outboxRepo = new SQLiteSyncOutboxRepository(db);
    const fiscalQueue = new SQLiteFiscalQueueAdapter();
    const printer = new EscPosReceiptPrinterAdapter(true);

    createSaleUseCase = new CreateSaleUseCase(
      uow,
      saleRepo,
      productRepo,
      inventoryRepo,
      sessionRepo,
      outboxRepo,
      fiscalQueue,
      printer
    );
  });

  afterEach(() => {
    db.close();
  });

  it('should atomically record a sale, decrement stock, append Kardex, and stage in sync_outbox', () => {
    const initialProduct = productRepo.findById(productId)!;
    expect(initialProduct.currentStock).toBe(100);

    const sale = createSaleUseCase.execute({
      registerSessionId: sessionId,
      userId,
      customerId: null,
      items: [
        {
          productId,
          quantity: 2,
          unitPriceCents: 150,
          lineDiscountCents: 0,
          taxAmountCents: 24,
        },
      ],
      payments: [
        {
          method: 'CASH',
          amountCents: 300,
          transactionReference: 'CASH-EXACT',
        },
      ],
    });

    // 1. Verify Sale Entity
    expect(sale.status).toBe('COMPLETED');
    expect(sale.total).toBe(300);

    // 2. Verify Stock Decrement
    const updatedProduct = productRepo.findById(productId)!;
    expect(updatedProduct.currentStock).toBe(98);

    // 3. Verify Kardex Ledger Entry
    const kardexRow = db
      .prepare("SELECT * FROM inventory_movements WHERE reference_id = ? AND type = 'SALE'")
      .get(sale.id) as { quantity_delta: number; resulting_stock: number };
    expect(kardexRow.quantity_delta).toBe(-2);
    expect(kardexRow.resulting_stock).toBe(98);

    // 4. Verify Transactional Outbox Staging
    const pendingEvents = outboxRepo.fetchPendingBatch(10);
    expect(pendingEvents.length).toBeGreaterThanOrEqual(1);
    const saleEvent = pendingEvents.find((e) => e.entityId === sale.id);
    expect(saleEvent).toBeDefined();
    expect(saleEvent?.status).toBe('PENDING');
  });

  it('should throw InsufficientStockError and leave database untouched when requesting more than on-hand', () => {
    expect(() => {
      createSaleUseCase.execute({
        registerSessionId: sessionId,
        userId,
        customerId: null,
        items: [
          {
            productId,
            quantity: 500, // Stock is 100
            unitPriceCents: 150,
            lineDiscountCents: 0,
            taxAmountCents: 24,
          },
        ],
        payments: [
          {
            method: 'CASH',
            amountCents: 75000,
            transactionReference: null,
          },
        ],
      });
    }).toThrow(InsufficientStockError);

    // Verify stock was not touched
    const product = productRepo.findById(productId)!;
    expect(product.currentStock).toBe(100);

    // Verify no sale was recorded
    const salesCount = (db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number }).count;
    expect(salesCount).toBe(0);
  });

  it('should throw InvalidPaymentTotalError when payment does not match gross total', () => {
    expect(() => {
      createSaleUseCase.execute({
        registerSessionId: sessionId,
        userId,
        customerId: null,
        items: [
          {
            productId,
            quantity: 1,
            unitPriceCents: 150,
            lineDiscountCents: 0,
            taxAmountCents: 24,
          },
        ],
        payments: [
          {
            method: 'CASH',
            amountCents: 100, // Expected 150
            transactionReference: null,
          },
        ],
      });
    }).toThrow(InvalidPaymentTotalError);
  });
});
