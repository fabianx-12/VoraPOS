import { v4 as uuidv4 } from 'uuid';
import { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ISaleRepository } from '../repositories/sale.repository.interface.js';
import { IProductRepository } from '../../catalog/repositories/product.repository.interface.js';
import { IInventoryRepository } from '../../inventory/repositories/inventory.repository.interface.js';
import { IRegisterSessionRepository } from '../../cash-register/repositories/register-session.repository.interface.js';
import { ISyncOutboxRepository } from '../../sync/repositories/sync-outbox.repository.interface.js';
import { IFiscalQueueAdapter } from '../../fiscal/adapters/fiscal-queue.adapter.js';
import { IReceiptPrinter } from '../../../infrastructure/hardware/receipt-printer.interface.js';
import { CheckoutRequestDTO } from '../dtos/checkout.dto.js';
import { Sale } from '../domain/sale.entity.js';
import { SaleItem } from '../domain/sale-item.entity.js';
import { SalePayment } from '../domain/sale-payment.entity.js';
import {
  RegisterClosedError,
  InsufficientStockError,
  EntityNotFoundError,
  InvalidPaymentTotalError,
} from '../../../shared/errors/domain.error.js';
import { toUUID, toCents } from '../../../shared/types/branded.types.js';
import { getCurrentIsoTimestamp } from '../../../shared/utils/date.utils.js';

export class CreateSaleUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly saleRepo: ISaleRepository,
    private readonly productRepo: IProductRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly sessionRepo: IRegisterSessionRepository,
    private readonly syncOutboxRepo: ISyncOutboxRepository,
    private readonly fiscalQueue: IFiscalQueueAdapter,
    private readonly printer: IReceiptPrinter
  ) {}

  public execute(dto: CheckoutRequestDTO, terminalPrefix = 'POS01'): Sale {
    const registerSessionId = toUUID(dto.registerSessionId);
    const userId = toUUID(dto.userId);
    const customerId = dto.customerId ? toUUID(dto.customerId) : null;
    const now = getCurrentIsoTimestamp();

    // 1. Verify Register Session is Active & OPEN
    const session = this.sessionRepo.findById(registerSessionId);
    if (!session || session.status !== 'OPEN') {
      throw new RegisterClosedError(dto.registerSessionId);
    }

    // 2. Pre-validate products & stock levels
    interface ValidatedItem {
      productId: ReturnType<typeof toUUID>;
      quantity: number;
      unitPriceCents: ReturnType<typeof toCents>;
      lineDiscountCents: ReturnType<typeof toCents>;
      taxAmountCents: ReturnType<typeof toCents>;
      lineTotalCents: ReturnType<typeof toCents>;
      trackInventory: boolean;
      currentStock: number;
    }

    const validatedItems: ValidatedItem[] = [];
    let calculatedSubtotal = 0;
    let calculatedDiscountTotal = 0;
    let calculatedTaxTotal = 0;
    let calculatedGrossTotal = 0;

    for (const item of dto.items) {
      const pId = toUUID(item.productId);
      const product = this.productRepo.findById(pId);
      if (!product) {
        throw new EntityNotFoundError('Product', item.productId);
      }

      if (product.trackInventory && product.currentStock < item.quantity) {
        throw new InsufficientStockError(item.productId, item.quantity, product.currentStock);
      }

      const lineTotal = item.quantity * item.unitPriceCents - item.lineDiscountCents;
      calculatedSubtotal += lineTotal - item.taxAmountCents;
      calculatedDiscountTotal += item.lineDiscountCents;
      calculatedTaxTotal += item.taxAmountCents;
      calculatedGrossTotal += lineTotal;

      validatedItems.push({
        productId: pId,
        quantity: item.quantity,
        unitPriceCents: toCents(item.unitPriceCents),
        lineDiscountCents: toCents(item.lineDiscountCents),
        taxAmountCents: toCents(item.taxAmountCents),
        lineTotalCents: toCents(lineTotal),
        trackInventory: product.trackInventory,
        currentStock: product.currentStock,
      });
    }

    // 3. Verify Payment Totals match Gross Total
    const totalPaymentsReceived = dto.payments.reduce((acc, p) => acc + p.amountCents, 0);
    if (totalPaymentsReceived !== calculatedGrossTotal) {
      throw new InvalidPaymentTotalError(calculatedGrossTotal, totalPaymentsReceived);
    }

    // 4. Atomic Execution inside Unit of Work (BEGIN IMMEDIATE ... COMMIT)
    const completedSale = this.uow.execute<Sale>((tx) => {
      const saleId = toUUID(uuidv4());
      const receiptNumber = this.saleRepo.getNextReceiptSequence(terminalPrefix, tx);

      const saleEntity: Sale = {
        id: saleId,
        receiptNumber,
        registerSessionId,
        userId,
        customerId,
        subtotal: toCents(calculatedSubtotal),
        discountTotal: toCents(calculatedDiscountTotal),
        taxTotal: toCents(calculatedTaxTotal),
        total: toCents(calculatedGrossTotal),
        status: 'COMPLETED',
        voidReason: null,
        voidedByUserId: null,
        createdAt: now,
        voidedAt: null,
      };

      // 4a. Persist Sale Header
      this.saleRepo.saveSale(saleEntity, tx);

      // 4b. Persist Line Items
      const saleItems: SaleItem[] = validatedItems.map((item) => ({
        id: toUUID(uuidv4()),
        saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        lineDiscount: item.lineDiscountCents,
        taxAmount: item.taxAmountCents,
        lineTotal: item.lineTotalCents,
      }));
      this.saleRepo.saveSaleItems(saleItems, tx);

      // 4c. Persist Payments
      const salePayments: SalePayment[] = dto.payments.map((p) => ({
        id: toUUID(uuidv4()),
        saleId,
        method: p.method,
        amount: toCents(p.amountCents),
        transactionReference: p.transactionReference,
        createdAt: now,
      }));
      this.saleRepo.saveSalePayments(salePayments, tx);

      // 4d. Deduct Inventory & Append to Kardex Ledger
      for (const item of validatedItems) {
        let resultingStock = item.currentStock;
        if (item.trackInventory) {
          resultingStock = this.productRepo.decrementStock(item.productId, item.quantity, tx);
        }

        this.inventoryRepo.recordMovement(
          {
            id: toUUID(uuidv4()),
            productId: item.productId,
            userId,
            type: 'SALE',
            quantityDelta: -item.quantity,
            resultingStock,
            referenceId: saleId,
            notes: `Sale receipt ${receiptNumber}`,
            createdAt: now,
          },
          tx
        );
      }

      // 4e. Enqueue Fiscal Document Generation
      this.fiscalQueue.enqueue(
        {
          id: toUUID(uuidv4()),
          saleId,
          documentType: 'POS_TICKET',
          submissionStatus: 'PENDING',
          fiscalUuidOrCufe: null,
          lastError: null,
          retryCount: 0,
          updatedAt: now,
        },
        tx
      );

      // 4f. Transactional Outbox Enqueue (for Cloud Sync Replay)
      this.syncOutboxRepo.enqueue(
        {
          entityName: 'sales',
          entityId: saleId,
          operation: 'INSERT',
          payloadJson: JSON.stringify({
            ...saleEntity,
            items: saleItems,
            payments: salePayments,
          }),
          status: 'PENDING',
          retryCount: 0,
          lastError: null,
          createdAt: now,
          syncedAt: null,
        },
        tx
      );

      return {
        ...saleEntity,
        items: saleItems,
        payments: salePayments,
      };
    });

    // 5. Asynchronous Hardware Action (Decoupled from Transaction)
    // Hardware failures (paper out, drawer jam) will NEVER fail or roll back the committed sale!
    setImmediate(async () => {
      try {
        const hasCash = dto.payments.some((p) => p.method === 'CASH');
        if (hasCash) {
          await this.printer.openCashDrawer().catch((err) => {
            console.error('[HARDWARE WARNING] Failed to trigger cash drawer kick:', err);
          });
        }

        await this.printer.printReceipt({
          sale: completedSale,
          storeName: 'VoraPOS Store #01',
          taxNumber: 'TAX-900.123.456-7',
          footerMessage: 'Thank you for your purchase!',
        });
      } catch (hardwareError) {
        console.error('[HARDWARE ASYNC WARNING] Receipt printing failed post-commit:', hardwareError);
      }
    });

    return completedSale;
  }
}
