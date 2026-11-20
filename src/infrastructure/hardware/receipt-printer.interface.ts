import { Sale } from '../../modules/sales/domain/sale.entity.js';

export interface PrintReceiptPayload {
  readonly sale: Sale;
  readonly storeName: string;
  readonly taxNumber: string;
  readonly footerMessage: string;
}

/**
 * Decoupled receipt printer interface.
 * Hardware operations MUST execute asynchronously so physical faults
 * (e.g., out of paper, paper jam) NEVER abort or roll back committed financial transactions.
 */
export interface IReceiptPrinter {
  printReceipt(payload: PrintReceiptPayload): Promise<void>;
  openCashDrawer(): Promise<void>;
  checkStatus(): Promise<'READY' | 'OUT_OF_PAPER' | 'OFFLINE' | 'JAMMED'>;
}
