import { SQLiteConnectionManager } from './shared/database/sqlite-connection.js';
import { SQLiteUnitOfWork } from './shared/database/unit-of-work.js';
import { MigrationRunner } from './shared/database/migration-runner.js';
import { SQLiteSaleRepository } from './modules/sales/repositories/sqlite-sale.repository.js';
import { SQLiteProductRepository } from './modules/catalog/repositories/sqlite-product.repository.js';
import { SQLiteInventoryRepository } from './modules/inventory/repositories/sqlite-inventory.repository.js';
import { SQLiteRegisterSessionRepository } from './modules/cash-register/repositories/sqlite-register-session.repository.js';
import { SQLiteSyncOutboxRepository } from './modules/sync/repositories/sqlite-sync-outbox.repository.js';
import { SQLiteFiscalQueueAdapter } from './modules/fiscal/adapters/fiscal-queue.adapter.js';
import { EscPosReceiptPrinterAdapter } from './infrastructure/hardware/escpos-printer.adapter.js';
import { SyncHttpClient } from './infrastructure/http/sync-http-client.js';
import { SyncWorker } from './modules/sync/workers/sync.worker.js';
import { CreateSaleUseCase } from './modules/sales/use-cases/create-sale.use-case.js';
import { VoidSaleUseCase } from './modules/sales/use-cases/void-sale.use-case.js';
import { IpcRouter } from './interfaces/ipc/ipc-router.js';
import { registerSalesIpcHandlers } from './interfaces/ipc/handlers/sales-ipc.handler.js';
import { createFastifySyncServer } from './interfaces/api/fastify-sync.server.js';
import { config } from './config/env.config.js';

async function bootstrap(): Promise<void> {
  console.info('====================================================');
  console.info('      VoraPOS Core Terminal Backend Starting...    ');
  console.info('====================================================');

  // 1. Establish SQLite Connection with Production Pragmas (WAL, synchronous=NORMAL)
  const db = SQLiteConnectionManager.getConnection(config.DATABASE_PATH);
  console.info(`[DATABASE] SQLite connection established at: "${config.DATABASE_PATH}"`);

  // 2. Execute Pending Migrations
  const migrationRunner = new MigrationRunner(db);
  migrationRunner.runMigrations('database/sqlite/migrations');

  // 3. Instantiate Unit of Work & Repositories
  const uow = new SQLiteUnitOfWork(db);
  const saleRepo = new SQLiteSaleRepository(db);
  const productRepo = new SQLiteProductRepository(db);
  const inventoryRepo = new SQLiteInventoryRepository(db);
  const sessionRepo = new SQLiteRegisterSessionRepository(db);
  const syncOutboxRepo = new SQLiteSyncOutboxRepository(db);
  const fiscalQueue = new SQLiteFiscalQueueAdapter();

  // 4. Instantiate Infrastructure Adapters (Hardware & Sync Client)
  const printer = new EscPosReceiptPrinterAdapter(config.PRINTER_INTERFACE === 'mock');
  const syncHttpClient = new SyncHttpClient(config.CLOUD_SYNC_URL, config.CLOUD_SYNC_API_KEY);

  // 5. Instantiate Domain Use Cases
  const createSaleUseCase = new CreateSaleUseCase(
    uow,
    saleRepo,
    productRepo,
    inventoryRepo,
    sessionRepo,
    syncOutboxRepo,
    fiscalQueue,
    printer
  );

  const voidSaleUseCase = new VoidSaleUseCase(
    uow,
    saleRepo,
    productRepo,
    inventoryRepo,
    syncOutboxRepo
  );

  // 6. Setup Electron / Desktop IPC Router
  const ipcRouter = new IpcRouter();
  registerSalesIpcHandlers(ipcRouter, createSaleUseCase, voidSaleUseCase, printer);
  console.info('[IPC] Registered typed IPC handlers for sales and hardware');

  // 7. Start Background Sync Worker (Transactional Outbox)
  const syncWorker = new SyncWorker(
    syncOutboxRepo,
    syncHttpClient,
    config.SYNC_INTERVAL_MS,
    config.SYNC_BATCH_SIZE
  );
  syncWorker.start();

  // 8. Start Fastify Sync API (For cloud hub deployment mode)
  const fastifyApp = createFastifySyncServer();
  await fastifyApp.listen({ port: config.SERVER_PORT, host: '0.0.0.0' });
  console.info(`[HTTP API] Central sync receiver listening on http://0.0.0.0:${config.SERVER_PORT}`);

  // 9. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    console.info(`\n[SHUTDOWN] Received ${signal}. Gracefully stopping VoraPOS backend...`);
    syncWorker.stop();
    await fastifyApp.close();
    SQLiteConnectionManager.closeConnection();
    console.info('[SHUTDOWN] SQLite connection closed. Cleanup complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap().catch((error) => {
  console.error('[FATAL] Failed to bootstrap VoraPOS core backend:', error);
  process.exit(1);
});
