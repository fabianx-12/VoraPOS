import { v4 as uuidv4 } from 'uuid';
import { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ISaleRepository } from '../repositories/sale.repository.interface.js';
import { IProductRepository } from '../../catalog/repositories/product.repository.interface.js';
import { IInventoryRepository } from '../../inventory/repositories/inventory.repository.interface.js';
import { ISyncOutboxRepository } from '../../sync/repositories/sync-outbox.repository.interface.js';
import { EntityNotFoundError, SaleAlreadyVoidedError } from '../../../shared/errors/domain.error.js';
import { UUID, toUUID } from '../../../shared/types/branded.types.js';
import { getCurrentIsoTimestamp } from '../../../shared/utils/date.utils.js';

export interface VoidSaleInput {
  readonly saleId: UUID;
  readonly voidReason: string;
  readonly voidedByUserId: UUID;
}

export class VoidSaleUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly saleRepo: ISaleRepository,
    private readonly productRepo: IProductRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly syncOutboxRepo: ISyncOutboxRepository
  ) {}

  public execute(input: VoidSaleInput): void {
    const sale = this.saleRepo.findById(input.saleId);
    if (!sale) {
      throw new EntityNotFoundError('Sale', input.saleId);
    }

    if (sale.status === 'VOIDED') {
      throw new SaleAlreadyVoidedError(input.saleId);
    }

    const now = getCurrentIsoTimestamp();

    this.uow.execute((tx) => {
      // 1. Mark status as VOIDED with audit fields
      this.saleRepo.markVoided(input.saleId, input.voidReason, input.voidedByUserId, now, tx);

      // 2. Restore Stock and Write Kardex Reversal Entries
      if (sale.items) {
        for (const item of sale.items) {
          const product = this.productRepo.findById(item.productId, tx);
          if (product && product.trackInventory) {
            const resultingStock = this.productRepo.incrementStock(item.productId, item.quantity, tx);

            this.inventoryRepo.recordMovement(
              {
                id: toUUID(uuidv4()),
                productId: item.productId,
                userId: input.voidedByUserId,
                type: 'RETURN',
                quantityDelta: item.quantity,
                resultingStock,
                referenceId: sale.id,
                notes: `Voided sale ${sale.receiptNumber}. Reason: ${input.voidReason}`,
                createdAt: now,
              },
              tx
            );
          }
        }
      }

      // 3. Stage Void event in sync_outbox for central cloud sync
      this.syncOutboxRepo.enqueue(
        {
          entityName: 'sales',
          entityId: sale.id,
          operation: 'VOID',
          payloadJson: JSON.stringify({
            saleId: sale.id,
            receiptNumber: sale.receiptNumber,
            voidReason: input.voidReason,
            voidedByUserId: input.voidedByUserId,
            voidedAt: now,
          }),
          status: 'PENDING',
          retryCount: 0,
          lastError: null,
          createdAt: now,
          syncedAt: null,
        },
        tx
      );
    });
  }
}
