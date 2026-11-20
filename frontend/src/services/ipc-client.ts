// Type definitions corresponding to backend IPC channels

export interface CheckoutPayload {
  registerSessionId: string;
  userId: string;
  customerId: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
    lineDiscountCents: number;
    taxAmountCents: number;
  }>;
  payments: Array<{
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
    amountCents: number;
    transactionReference: string | null;
  }>;
}

export interface SaleResponse {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  status: 'COMPLETED' | 'VOIDED';
  createdAt: string;
}

export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Type-Safe IPC client adapter communicating with the Electron main backend core.
 */
export class PosIpcClient {
  public static async createSale(payload: CheckoutPayload): Promise<IpcResponse<SaleResponse>> {
    const electron = (window as unknown as { electronAPI?: { invoke: (ch: string, data: unknown) => Promise<IpcResponse<SaleResponse>> } }).electronAPI;
    if (electron) {
      return electron.invoke('sales:create', payload);
    }

    // Development Mock Response when running in browser Vite dev server
    console.warn('[IPC CLIENT MOCK] Electron bridge not detected. Returning simulated sale response.');
    return {
      success: true,
      data: {
        id: 'mock-sale-uuid-001',
        receiptNumber: 'POS01-00000001',
        subtotal: 294,
        discountTotal: 0,
        taxTotal: 56,
        total: 350,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static async checkPrinterStatus(): Promise<'READY' | 'OUT_OF_PAPER' | 'OFFLINE' | 'JAMMED'> {
    const electron = (window as unknown as { electronAPI?: { invoke: (ch: string) => Promise<{ status: 'READY' | 'OUT_OF_PAPER' | 'OFFLINE' | 'JAMMED' }> } }).electronAPI;
    if (electron) {
      const res = await electron.invoke('printer:status');
      return res.status;
    }
    return 'READY';
  }
}
