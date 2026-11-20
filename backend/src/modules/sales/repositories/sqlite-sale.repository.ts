import { Database } from 'better-sqlite3';
import { ISaleRepository } from './sale.repository.interface.js';
import { Sale } from '../domain/sale.entity.js';
import { SaleItem } from '../domain/sale-item.entity.js';
import { SalePayment } from '../domain/sale-payment.entity.js';
import { UUID, toUUID, toCents } from '../../../shared/types/branded.types.js';

export class SQLiteSaleRepository implements ISaleRepository {
  constructor(private readonly db: Database) {}

  public findById(id: UUID, tx?: Database): Sale | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT * FROM sales WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    const items = conn
      .prepare('SELECT * FROM sale_items WHERE sale_id = ?')
      .all(id) as Array<Record<string, unknown>>;

    const payments = conn
      .prepare('SELECT * FROM sale_payments WHERE sale_id = ?')
      .all(id) as Array<Record<string, unknown>>;

    return {
      id: toUUID(row['id'] as string),
      receiptNumber: row['receipt_number'] as string,
      registerSessionId: toUUID(row['register_session_id'] as string),
      userId: toUUID(row['user_id'] as string),
      customerId: row['customer_id'] ? toUUID(row['customer_id'] as string) : null,
      subtotal: toCents(row['subtotal'] as number),
      discountTotal: toCents(row['discount_total'] as number),
      taxTotal: toCents(row['tax_total'] as number),
      total: toCents(row['total'] as number),
      status: row['status'] as 'COMPLETED' | 'VOIDED',
      voidReason: (row['void_reason'] as string) || null,
      voidedByUserId: row['voided_by_user_id'] ? toUUID(row['voided_by_user_id'] as string) : null,
      createdAt: row['created_at'] as string,
      voidedAt: (row['voided_at'] as string) || null,
      items: items.map((i) => ({
        id: toUUID(i['id'] as string),
        saleId: toUUID(i['sale_id'] as string),
        productId: toUUID(i['product_id'] as string),
        quantity: i['quantity'] as number,
        unitPrice: toCents(i['unit_price'] as number),
        lineDiscount: toCents(i['line_discount'] as number),
        taxAmount: toCents(i['tax_amount'] as number),
        lineTotal: toCents(i['line_total'] as number),
      })),
      payments: payments.map((p) => ({
        id: toUUID(p['id'] as string),
        saleId: toUUID(p['sale_id'] as string),
        method: p['method'] as 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER',
        amount: toCents(p['amount'] as number),
        transactionReference: (p['transaction_reference'] as string) || null,
        createdAt: p['created_at'] as string,
      })),
    };
  }

  public findByReceiptNumber(receiptNumber: string, tx?: Database): Sale | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT id FROM sales WHERE receipt_number = ?')
      .get(receiptNumber) as { id: string } | undefined;

    return row ? this.findById(toUUID(row.id), conn) : null;
  }

  public saveSale(sale: Sale, tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO sales (
        id, receipt_number, register_session_id, user_id, customer_id,
        subtotal, discount_total, tax_total, total, status,
        void_reason, voided_by_user_id, created_at, voided_at
      ) VALUES (
        @id, @receiptNumber, @registerSessionId, @userId, @customerId,
        @subtotal, @discountTotal, @taxTotal, @total, @status,
        @voidReason, @voidedByUserId, @createdAt, @voidedAt
      )
    `);

    stmt.run({
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      registerSessionId: sale.registerSessionId,
      userId: sale.userId,
      customerId: sale.customerId,
      subtotal: sale.subtotal,
      discountTotal: sale.discountTotal,
      taxTotal: sale.taxTotal,
      total: sale.total,
      status: sale.status,
      voidReason: sale.voidReason,
      voidedByUserId: sale.voidedByUserId,
      createdAt: sale.createdAt,
      voidedAt: sale.voidedAt,
    });
  }

  public saveSaleItems(items: readonly SaleItem[], tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, quantity, unit_price, line_discount, tax_amount, line_total
      ) VALUES (
        @id, @saleId, @productId, @quantity, @unitPrice, @lineDiscount, @taxAmount, @lineTotal
      )
    `);

    for (const item of items) {
      stmt.run({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineDiscount: item.lineDiscount,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
      });
    }
  }

  public saveSalePayments(payments: readonly SalePayment[], tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO sale_payments (
        id, sale_id, method, amount, transaction_reference, created_at
      ) VALUES (
        @id, @saleId, @method, @amount, @transactionReference, @createdAt
      )
    `);

    for (const payment of payments) {
      stmt.run({
        id: payment.id,
        saleId: payment.saleId,
        method: payment.method,
        amount: payment.amount,
        transactionReference: payment.transactionReference,
        createdAt: payment.createdAt,
      });
    }
  }

  public markVoided(
    saleId: UUID,
    voidReason: string,
    voidedByUserId: UUID,
    voidedAt: string,
    tx: Database
  ): void {
    const stmt = tx.prepare(`
      UPDATE sales
      SET status = 'VOIDED',
          void_reason = ?,
          voided_by_user_id = ?,
          voided_at = ?
      WHERE id = ? AND status = 'COMPLETED'
    `);

    stmt.run(voidReason, voidedByUserId, voidedAt, saleId);
  }

  public getNextReceiptSequence(prefix: string, tx: Database): string {
    const countRow = tx
      .prepare('SELECT COUNT(*) as count FROM sales WHERE receipt_number LIKE ?')
      .get(`${prefix}-%`) as { count: number };

    const nextSeq = (countRow.count + 1).toString().padStart(8, '0');
    return `${prefix}-${nextSeq}`;
  }
}
