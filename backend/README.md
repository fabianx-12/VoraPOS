# VoraPOS — Backend Core

Node.js + TypeScript backend engine for a VoraPOS desktop terminal.  
Implements **Clean Architecture** with Feature-Based Modularity (DDD boundaries).

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS (ESM) |
| Language | TypeScript 5 — strict mode |
| Local Database | `better-sqlite3` (synchronous ACID, WAL mode) |
| Cloud API Server | Fastify 4 |
| Validation | Zod 3 |
| Test Runner | Vitest |
| Hardware | ESC/POS via `escpos` / `serialport` |

---

## 📁 Module Structure

```text
backend/src/
├── config/          # Zod-validated env, SQLite pragmas, hardware port config
├── shared/
│   ├── types/       # Branded types: UUID, Cents, BasisPoints; Result<T,E>
│   ├── errors/      # Domain error classes (InsufficientStockError, etc.)
│   ├── utils/       # Date, currency, crypto helpers — pure functions only
│   └── database/    # SQLiteConnectionManager, SQLiteUnitOfWork, MigrationRunner
├── modules/
│   ├── auth/        # Users, Roles, PIN auth
│   ├── cash-register/  # Register sessions, shifts, cash in/out
│   ├── catalog/     # Products, categories, taxes, barcode lookup
│   ├── inventory/   # Kardex ledger, stock adjustments, low-stock alerts
│   ├── sales/       # Checkout orchestration, void, discounts, payments
│   ├── fiscal/      # Electronic invoice / DIAN queue adapter
│   └── sync/        # Transactional Outbox, cloud sync worker
├── infrastructure/
│   ├── hardware/    # EscPosReceiptPrinterAdapter, cash drawer
│   └── http/        # SyncHttpClient — retries, exponential backoff
├── interfaces/
│   ├── ipc/         # Electron IPC typed channels + Zod middleware
│   └── api/         # Fastify REST (cloud hub sync receiver)
└── main.ts          # Composition Root — DI wiring & lifecycle
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_PATH, CLOUD_SYNC_URL, PRINTER_INTERFACE, etc.
```

### 3. Apply local SQLite migrations

```bash
# Option A — via npm script (requires sqlite3 CLI on PATH)
npm run db:migrate

# Option B — via bootstrap script from project root
# Windows:
..\scripts\setup_database.ps1 -DatabasePath vorapos.db
# Linux/macOS:
bash ../scripts/setup_database.sh vorapos.db
```

### 4. Run in development mode

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
# Output: backend/dist/
```

---

## 🧪 Testing

```bash
# Run all tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

> Integration tests use an **in-memory SQLite** instance — no external database setup required.

---

## 📋 npm Scripts

| Script | Description |
|---|---|
| `dev` | `ts-node-esm src/main.ts` — hot reload dev server |
| `build` | `tsc --project tsconfig.json` — emit to `dist/` |
| `start` | `node dist/main.js` — run compiled production build |
| `test` | `vitest run` — single-pass test suite |
| `test:watch` | `vitest` — interactive watch mode |
| `test:coverage` | `vitest run --coverage` — V8 coverage report |
| `db:migrate` | Apply pending SQLite migrations via MigrationRunner |
| `lint` | `eslint src tests` |
| `typecheck` | `tsc --noEmit` |

---

## 🔒 Architectural Constraints

1. **Money is always integers** — cents (centavos). `\$10.50` → `1050`. Never `float`.
2. **Taxes are always integers** — basis points. `19 %` → `1900 bps`.
3. **No hard deletes** on sales, inventory movements, or cash register events.
4. **Hardware never rolls back a transaction** — printer and drawer commands run after `COMMIT`, asynchronously, behind `IReceiptPrinter`.
5. **Circular dependencies are banned** — modules may only depend on `shared/`. Modules never import from each other directly; wire via use-cases in `main.ts`.
