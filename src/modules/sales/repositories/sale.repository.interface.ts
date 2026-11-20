import { Database } from 'better-sqlite3';
import { Sale } from '../domain/sale.entity.js';
import { SaleItem } from '../domain/sale-item.entity.js';
import { SalePayment } from '../domain/sale-payment.entity.js';
import { UUID } from '../../../shared/types/branded.types.js';

export interface ISaleRepository {
  findById(id: UUID, tx?: Database): Sale | null;
  findByReceiptNumber(receiptNumber: string, tx?: Database): Sale | null;
  saveSale(sale: Sale, tx: Database): void;
  saveSaleItems(items: readonly SaleItem[], tx: Database): void;
  saveSalePayments(payments: readonly SalePayment[], tx: Database): void;
  markVoided(saleId: UUID, voidReason: string, voidedByUserId: UUID, voidedAt: string, tx: Database): void;
  getNextReceiptSequence(prefix: string, tx: Database): string;
}
