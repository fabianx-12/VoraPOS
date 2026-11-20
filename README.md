# VoraPOS - Production Offline-First POS Backend Core

Production-grade, offline-first backend engine and relational database architecture for the **VoraPOS** desktop Point of Sale system. Designed following **Clean Architecture** and **Feature-Based Modularity** (Domain-Driven Boundaries).

---

## 🗂️ Complete Project Hierarchy

```text
VoraPOS/
├── package.json                         # Node.js project manifest & dependencies
├── tsconfig.json                        # TypeScript strict mode configuration
├── src/
│   ├── config/                          # Centralized environment, database pragmas & hardware settings
│   │   ├── env.config.ts                # Zod-validated environment runtime configuration
│   │   ├── database.config.ts           # SQLite WAL, cache size, and busy_timeout tuning
│   │   └── hardware.config.ts           # ESC/POS printer & RJ11 cash drawer pulse timings
│   ├── shared/                          # Cross-cutting concerns (zero business logic)
│   │   ├── types/                       # Branded types (UUID, Cents, BasisPoints), Result/Either pattern
│   │   │   ├── branded.types.ts
│   │   │   ├── result.types.ts
│   │   │   └── pagination.types.ts
│   │   ├── errors/                      # Explicit Domain and Infrastructure error classes
│   │   │   ├── domain.error.ts
│   │   │   └── error-codes.enum.ts
│   │   ├── utils/                       # Deterministic date, currency (cents), and crypto utilities
│   │   │   ├── date.utils.ts
│   │   │   ├── currency.utils.ts
│   │   │   └── crypto.utils.ts
│   │   └── database/                    # Connection manager, Unit of Work (BEGIN IMMEDIATE), and Migrations
│   │       ├── sqlite-connection.ts
│   │       ├── unit-of-work.ts
│   │       └── migration-runner.ts
│   ├── modules/                         # Feature-based domain modules (Clean Architecture inside each)
│   │   ├── auth/                        # Users, Roles, and PIN authorization
│   │   │   ├── domain/                  # User and Role entities
│   │   │   └── repositories/            # IUserRepository interface
│   │   ├── cash-register/               # Registers, Sessions (Open/Close shifts), Cash In/Out
│   │   │   ├── domain/                  # RegisterSession and CashMovement entities
│   │   │   └── repositories/            # IRegisterSessionRepository interface & SQLite implementation
│   │   ├── catalog/                     # Products, Categories, Taxes, Barcode/SKU lookups
│   │   │   ├── domain/                  # Product and Tax entities
│   │   │   └── repositories/            # IProductRepository interface & SQLite implementation
│   │   ├── inventory/                   # Append-only Kardex ledger, stock movements, reconciliation
│   │   │   ├── domain/                  # InventoryMovement entity
│   │   │   └── repositories/            # IInventoryRepository interface & SQLite implementation
│   │   ├── sales/                       # Checkout orchestration, Voiding, Discounts, Payments
│   │   │   ├── domain/                  # Sale, SaleItem, and SalePayment entities
│   │   │   ├── dtos/                    # Zod schemas for CheckoutRequestDTO
│   │   │   ├── repositories/            # ISaleRepository interface & SQLite implementation
│   │   │   └── use-cases/               # CreateSaleUseCase (Atomic UoW) & VoidSaleUseCase
│   │   ├── fiscal/                      # Electronic invoicing / DIAN / Equivalent doc queue adapter
│   │   │   ├── domain/                  # FiscalDocument entity
│   │   │   └── adapters/                # SQLiteFiscalQueueAdapter
│   │   └── sync/                        # Transactional Outbox processor, Cloud API client, Conflict resolver
│   │       ├── domain/                  # SyncOutboxEntry entity
│   │       ├── repositories/            # ISyncOutboxRepository interface & SQLite implementation
│   │       └── workers/                 # SyncWorker (asynchronous polling with exponential backoff)
│   ├── infrastructure/                  # External drivers & concrete hardware/network adapters
│   │   ├── hardware/                    # ESC/POS Thermal Printer, Cash Drawer (RJ11)
│   │   │   ├── receipt-printer.interface.ts
│   │   │   └── escpos-printer.adapter.ts
│   │   └── http/                        # Typed HTTP client with retry/jitter for cloud synchronization
│   │       └── sync-http-client.ts
│   ├── interfaces/                      # Entry points to the backend
│   │   ├── ipc/                         # Electron IPC typed channels & Zod validation middleware
│   │   │   ├── ipc-channels.ts
│   │   │   ├── ipc-router.ts
│   │   │   └── handlers/
│   │   └── api/                         # Fastify sync endpoints (for receiving terminal sync payloads)
│   │       ├── fastify-sync.server.ts
│   │       └── controllers/
│   └── main.ts                          # Composition Root (Dependency Injection wiring & lifecycle)
├── database/
│   ├── config/                          # SQLite connection tuning pragmas
│   ├── ddl/                             # Modular DDL schemas by business domain
│   ├── migrations/                      # Versioned SQLite & PostgreSQL schema migrations
│   │   └── v1.0.0_initial_schema.sql
│   ├── seeds/                           # Baseline seed data (roles, admin, taxes, products, Kardex)
│   │   └── master_seed.sql
│   └── examples/                        # Standalone atomic transaction demonstration
│       └── checkout_transaction.sql
├── docs/                                # Technical & architectural specifications
│   ├── architecture/                    # In-depth architectural decisions & sync patterns
│   └── dictionary/                      # Database data dictionary
├── scripts/                             # Bootstrap automation scripts (.ps1 and .sh)
└── tests/
    ├── unit/                            # Pure business logic & financial calculation tests
    │   └── sales-calculation.spec.ts
    └── integration/                     # In-memory SQLite transaction & sync outbox integration tests
        └── create-sale-uow.spec.ts
```

---

## 🏛️ Core Architectural Patterns

### 1. Atomic Unit of Work (`SQLiteUnitOfWork`)
Complex checkout operations must never leave the database in an inconsistent state. `CreateSaleUseCase` executes within:
```typescript
uow.execute((tx) => {
  saleRepo.saveSale(sale, tx);
  saleRepo.saveSaleItems(items, tx);
  saleRepo.saveSalePayments(payments, tx);
  productRepo.decrementStock(productId, qty, tx);
  inventoryRepo.recordMovement(kardexEntry, tx);
  fiscalQueue.enqueue(fiscalDoc, tx);
  syncOutboxRepo.enqueue(syncEvent, tx);
});
```
*(Uses `better-sqlite3`'s `transaction().immediate()`, which triggers `BEGIN IMMEDIATE ... COMMIT/ROLLBACK` to prevent mid-transaction lock escalation deadlocks).*

### 2. Decoupled Hardware Operations
Thermal printers and cash drawers run strictly **after** transaction commit via `setImmediate`:
- A paper jam, out-of-paper sensor, or unplugged USB cable will **never** roll back an already-committed financial transaction.

### 3. Strict Financial Precision
- All currency amounts are typed as branded `Cents` (`INTEGER`).
- Tax rates are typed as branded `BasisPoints` (`INTEGER`, e.g., $1900 = 19.00\%$).
- All floating-point arithmetic is explicitly forbidden at the domain layer.

### 4. Transactional Outbox Pattern
Every mutating operation automatically produces a pending outbox record. The `SyncWorker` periodically polls `sync_outbox` and replays events to the central PostgreSQL server with exponential backoff and idempotency keys.

---

## 🧪 Testing

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```
