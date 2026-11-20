import { IpcRouter } from '../ipc-router.js';
import { CreateSaleUseCase } from '../../../modules/sales/use-cases/create-sale.use-case.js';
import { VoidSaleUseCase } from '../../../modules/sales/use-cases/void-sale.use-case.js';
import { checkoutRequestSchema } from '../../../modules/sales/dtos/checkout.dto.js';
import { IReceiptPrinter } from '../../../infrastructure/hardware/receipt-printer.interface.js';

export function registerSalesIpcHandlers(
  router: IpcRouter,
  createSaleUseCase: CreateSaleUseCase,
  voidSaleUseCase: VoidSaleUseCase,
  printer: IReceiptPrinter
): void {
  // Channel: sales:create
  router.register(
    'sales:create',
    async (dto) => {
      return createSaleUseCase.execute(dto);
    },
    checkoutRequestSchema
  );

  // Channel: sales:void
  router.register('sales:void', async (input) => {
    voidSaleUseCase.execute(input);
    return { success: true };
  });

  // Channel: printer:status
  router.register('printer:status', async () => {
    const status = await printer.checkStatus();
    return { status };
  });
}
