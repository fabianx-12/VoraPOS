import { IReceiptPrinter, PrintReceiptPayload } from './receipt-printer.interface.js';
import { formatCentsToCurrency } from '../../shared/utils/currency.utils.js';

export class EscPosReceiptPrinterAdapter implements IReceiptPrinter {
  constructor(private readonly isMock = false) {}

  public async printReceipt(payload: PrintReceiptPayload): Promise<void> {
    const { sale, storeName } = payload;

    // Simulated ESC/POS command formatting
    const lines: string[] = [
      '================================================',
      `                 ${storeName}                   `,
      `Receipt: ${sale.receiptNumber}                  `,
      `Date: ${sale.createdAt}                        `,
      '------------------------------------------------',
    ];

    if (sale.items) {
      for (const item of sale.items) {
        const totalFormatted = formatCentsToCurrency(item.lineTotal);
        lines.push(`Item: ${item.productId.slice(0, 8)}... x${item.quantity}  ${totalFormatted}`);
      }
    }

    lines.push('------------------------------------------------');
    lines.push(`TOTAL: ${formatCentsToCurrency(sale.total)}`);
    lines.push('================================================\n\n');

    if (this.isMock) {
      console.info('[HARDWARE MOCK] ESC/POS Thermal Print Output:\n' + lines.join('\n'));
      return;
    }

    // In production with node-thermal-printer or raw USB/Serial endpoints,
    // ESC/POS hex codes (\x1B\x40 init, \x1D\x56 cut) are sent to the device handle.
  }

  public async openCashDrawer(): Promise<void> {
    if (this.isMock) {
      console.info('[HARDWARE MOCK] Pulse sent to RJ11 Cash Drawer pin 2: DRAWER OPENED');
      return;
    }
    // ESC p 0 25 250 (Pulse to cash drawer connector)
  }

  public async checkStatus(): Promise<'READY' | 'OUT_OF_PAPER' | 'OFFLINE' | 'JAMMED'> {
    return 'READY';
  }
}
