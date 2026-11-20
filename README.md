# VoraPOS - Hybrid Offline-First POS Backend Engine

Production-grade, offline-first Point of Sale (POS) architecture engineered with a **Dual-Engine Hybrid Model**:
- **Desktop Terminals (Edge Core):** Embedded **SQLite** via `better-sqlite3` for zero-configuration, 100% offline availability, and sub-millisecond barcode checkout.
- **Central Cloud Hub (Consolidation Master):** Scalable **PostgreSQL** for multi-store data aggregation, global catalog distribution, e-commerce synchronization, and consolidated business intelligence (BI).

---

## 🏛️ Why a Hybrid Architecture? (SQLite + PostgreSQL)

```
+---------------------------------------------------------------------------------------+
|                               LOCAL POS TERMINALS (EDGE)                              |
|                                                                                       |
|  [POS-01 Desktop App]                     [POS-02 Desktop App]                        |
|   ├── Node.js Core Backend                 ├── Node.js Core Backend                   |
|   └── Embedded SQLite (WAL Mode)           └── Embedded SQLite (WAL Mode)             |
|        ├── Instant Checkout (<1ms)              ├── Instant Checkout (<1ms)           |
|        ├── Full Offline Autonomy                ├── Full Offline Autonomy             |
|        └── Transactional Outbox (FIFO)          └── Transactional Outbox (FIFO)       |
+----------------------------------------+----------------------------------------------+
                                         |
                                         | Background Outbox Sync (HTTPS / Fastify API)
                                         v
+---------------------------------------------------------------------------------------+
|                              CENTRAL CLOUD MASTER (HUB)                               |
|                                                                                       |
|  [Fastify Ingestion API Server]                                                       |
|   └── PostgreSQL Central Database Cluster                                             |
|        ├── Multi-Terminal Sales Consolidation                                         |
|        ├── Global Kardex & Multi-Store Stock Aggregation                              |
|        ├── Master Catalog Management & Delta Cursor Distribution                      |
|        └── Central Business Intelligence, Reporting & Admin Dashboard                 |
+---------------------------------------------------------------------------------------+
```

### 1. The Role of SQLite at the Edge (Desktop Cash Registers)
- **Zero Configuration for Retail Staff:** Operating a POS terminal does not require installing, configuring, or maintaining a heavy database daemon (such as a local PostgreSQL or MySQL service) on cashier machines.
- **100% Offline Resilience:** Retail stores frequently suffer internet outages. SQLite guarantees that barcode scanning, sales receipts, drawer kicks, and inventory deductions continue with **zero interruption** and sub-millisecond local latency.
- **Minimal Footprint:** Negligible RAM and CPU overhead, perfectly suited for low-resource touchscreen terminals.
- **ACID Integrity with `BEGIN IMMEDIATE`:** Local transactions reserve write locks up front in Write-Ahead Logging (`WAL`) mode, eliminating lock contention.

### 2. The Role of PostgreSQL in the Cloud (Central Master)
- **Multi-Terminal Consolidation:** High-concurrency relational hub that ingests asynchronous sales batches from dozens or hundreds of distributed offline terminals.
- **Master Data Authority:** PostgreSQL is the single source of truth for global product pricing, tax brackets, user authentication tiers, and enterprise-wide financial reporting.
- **Native Enterprise Capabilities:** Leverages native `UUID`, `BIGINT` monetary precision, `JSONB` document storage for outbox replay diagnostics, and robust analytics indexing.

---

## 🗂️ Project Directory Structure

```text
VoraPOS/
├── .gitignore                           # Git exclusion rules (node_modules, dist, .env, *.db)
├── README.md                            # This file — project overview & bootstrap guide
│
├── backend/                             # ── Node.js Core Backend (TypeScript, Clean Architecture)
│   ├── package.json                     # Backend dependencies (better-sqlite3, fastify, zod, vitest)
│   ├── tsconfig.json                    # TypeScript strict mode — ESM, path aliases
│   ├── vitest.config.ts                 # Vitest test runner configuration
│   ├── .env.example                     # Environment variable template (copy → .env)
│   ├── README.md                        # Backend module guide & dev commands
│   └── src/
│       ├── config/                      # Centralized environment, database & hardware settings
│       │   ├── env.config.ts            # Zod-validated runtime environment variables
│       │   ├── database.config.ts       # SQLite WAL, cache_size & busy_timeout tuning
│       │   └── hardware.config.ts       # ESC/POS printer & RJ11 cash drawer pulse config
│       ├── shared/                      # Cross-cutting concerns — zero business logic allowed
│       │   ├── types/                   # Branded types: UUID, Cents, BasisPoints; Result/Either
│       │   ├── errors/                  # Explicit Domain & Infrastructure error classes
│       │   ├── utils/                   # Deterministic date, currency (cents), crypto utilities
│       │   └── database/               # SQLite connection manager, UnitOfWork (BEGIN IMMEDIATE), MigrationRunner
│       ├── modules/                     # Feature-based domain modules (Clean Architecture per module)
│       │   ├── auth/                    # Users, Roles, PIN fast-switch, permission guards
│       │   ├── cash-register/           # Registers, Sessions (Open/Close shifts), Cash In/Out, Z-Report
│       │   ├── catalog/                 # Products, Categories, Taxes, Barcode/SKU lookups
│       │   ├── inventory/              # Append-only Kardex ledger, stock movements, reconciliation
│       │   ├── sales/                   # Checkout orchestration, Voiding, Discounts, Payments
│       │   ├── fiscal/                  # Electronic invoicing / DIAN / Equivalent document queue adapter
│       │   └── sync/                    # Transactional Outbox processor, Cloud API client, Conflict resolver
│       ├── infrastructure/              # Concrete adapters for external drivers (hardware & network)
│       │   ├── hardware/               # ESC/POS Thermal Printer adapter, Cash Drawer (RJ11)
│       │   └── http/                    # Typed HTTP client with exponential retry/jitter for cloud sync
│       ├── interfaces/                  # Backend entry points (IPC & REST)
│       │   ├── ipc/                     # Electron IPC typed channels & Zod validation middleware
│       │   └── api/                     # Fastify sync receiver endpoints (ingests terminal outbox batches)
│       └── main.ts                      # Composition Root — DI wiring, lifecycle, graceful shutdown
│   └── tests/
│       ├── unit/                        # Pure business logic & financial calculation tests
│       └── integration/                 # In-memory SQLite transaction & sync outbox tests
│
├── database/                            # ── All database definitions — strictly separated by engine
│   ├── sqlite/                          # Terminal Edge Engine (embedded, offline-first)
│   │   ├── config/
│   │   │   └── sqlite_pragmas.sql       # WAL mode, synchronous=NORMAL, cache_size, foreign_keys
│   │   ├── ddl/                         # Modular DDL schemas split by business domain
│   │   │   ├── 01_users_roles_shifts.sql
│   │   │   ├── 02_catalog_inventory.sql
│   │   │   ├── 03_sales_billing.sql
│   │   │   ├── 04_sync_outbox.sql
│   │   │   └── 05_indexes.sql
│   │   ├── migrations/
│   │   │   └── v1.0.0_initial_schema.sql   # Full consolidated migration for MigrationRunner
│   │   ├── seeds/
│   │   │   ├── 01_roles_admin.sql
│   │   │   ├── 02_registers_taxes.sql
│   │   │   ├── 03_catalog_products.sql
│   │   │   ├── 04_initial_kardex.sql
│   │   │   └── master_seed.sql             # Orchestrator — runs all seeds in order
│   │   └── examples/
│   │       └── checkout_transaction.sql    # Production atomic checkout (BEGIN IMMEDIATE…COMMIT)
│   └── postgres/                        # Cloud Hub Engine (central consolidation master)
│       ├── migrations/
│       │   └── postgres_cloud_v1.0.0.sql   # Cloud PostgreSQL schema migration
│       └── seeds/
│           └── postgres_cloud_seeds.sql    # Cloud master catalog & admin seed data
│
├── frontend/                            # ── Desktop UI (Electron + React + TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   └── src/
│       ├── services/
│       │   └── ipc-client.ts            # Typed IPC client (invokes backend use cases via Electron IPC)
│       ├── views/
│       │   └── CheckoutView.tsx         # Main POS checkout screen
│       ├── components/                  # Reusable UI design system components
│       └── hooks/                       # React custom hooks (useCart, useBarcodeScanner, etc.)
│
├── docs/                                # ── Technical & architectural documentation
│   ├── architecture/
│   │   ├── ARCHITECTURE.md              # Hybrid architecture decisions, UUID strategy, Kardex design
│   │   └── SYNC_PATTERNS.md            # Transactional Outbox pattern & PostgreSQL replication flows
│   └── dictionary/
│       └── DATA_DICTIONARY.md           # Full database data dictionary
│
└── scripts/                             # ── Automation & bootstrap scripts
    ├── setup_database.ps1               # Windows PowerShell: apply SQLite schema + seeds
    └── setup_database.sh                # Linux/macOS Bash: apply SQLite schema + seeds
```

---

## 🚀 Database Bootstrap & Migration Commands

### 1. Terminal Edge (SQLite)
Bootstrap local terminal database with schema, performance indexes, and seed catalog:
```powershell
# Windows (PowerShell)
.\scripts\setup_database.ps1 -DatabasePath vorapos.db

# Linux / macOS (Bash)
chmod +x scripts/setup_database.sh
./scripts/setup_database.sh vorapos.db
```

### 2. Central Cloud Hub (PostgreSQL)
Apply the cloud master schema and seed master catalog:
```bash
# Apply Cloud PostgreSQL Schema
psql -h localhost -U postgres -d vorapos_cloud -f database/postgres/migrations/postgres_cloud_v1.0.0.sql

# Apply Cloud PostgreSQL Seeds
psql -h localhost -U postgres -d vorapos_cloud -f database/postgres/seeds/postgres_cloud_seeds.sql
```

---

## ⚡ Core Architectural Guarantees

1. **Strict Financial Precision:**
   - All currencies stored as integers (`INTEGER` in SQLite, `BIGINT` in PostgreSQL) representing the smallest currency unit (cents/centavos: \$10.50 $\rightarrow$ `1050`).
   - Tax rates stored as integer basis points ($1\text{ bps} = 0.01\%$, $1900\text{ bps} = 19.00\%$).
2. **Atomic Unit of Work (`SQLiteUnitOfWork`):**
   - Checkout uses `db.transaction(fn).immediate()` (`BEGIN IMMEDIATE`), ensuring simultaneous inventory deductions, Kardex updates, payment insertions, and outbox event enqueueing.
3. **Decoupled Hardware Execution:**
   - Thermal receipt printing and cash drawer triggers execute strictly asynchronously after commit. Hardware failures (paper jams, disconnected cables) never abort completed sales.
4. **Transactional Outbox Sync Worker:**
   - Background worker processes local outbox entries with exponential backoff and idempotency keys, replaying mutations to the cloud Fastify API.
