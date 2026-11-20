# VoraPOS - Production Offline-First POS SQLite Database

Production-grade, offline-first relational database architecture for the **VoraPOS** desktop Point of Sale system. Designed for extreme reliability, multi-terminal concurrency, strict financial precision, append-only inventory auditing (Kardex), and resilient bi-directional cloud replication to PostgreSQL.

---

## 🗂️ Project Structure

```
VoraPOS/
├── database/
│   ├── config/
│   │   └── sqlite_pragmas.sql           # Connection tuning (WAL mode, foreign keys, synchronous=NORMAL)
│   ├── ddl/
│   │   ├── 01_users_roles_shifts.sql    # Module 1: Roles, Users, Registers, Sessions, Cash Movements
│   │   ├── 02_catalog_inventory.sql     # Module 2: Categories, Taxes, Products, Kardex (inventory_movements)
│   │   ├── 03_sales_billing.sql         # Module 3: Customers, Sales, Items, Payments, Fiscal Documents
│   │   ├── 04_sync_outbox.sql           # Module 4: Sync Outbox, Checkpoints
│   │   └── 05_indexes.sql               # Dedicated Performance, FK & Audit Indexes
│   ├── migrations/
│   │   └── v1.0.0_initial_schema.sql    # Consolidated production schema DDL
│   ├── seeds/
│   │   ├── 01_roles_admin.sql           # Initial System Roles & Administrator
│   │   ├── 02_registers_taxes.sql       # Default Register (POS-01) & Tax rates (0%, 19%)
│   │   ├── 03_catalog_products.sql      # Initial Categories & 5 Products
│   │   ├── 04_initial_kardex.sql        # Initial Inventory Kardex Balance Entries
│   │   └── master_seed.sql              # Consolidated Master Seed
│   └── examples/
│       └── checkout_transaction.sql     # Production atomic transaction (BEGIN IMMEDIATE ... COMMIT)
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md              # In-depth architectural decisions, UUID strategy, precision, Kardex
│   │   └── SYNC_PATTERNS.md             # Outbox pattern & bi-directional sync specifications with PostgreSQL
│   └── dictionary/
│       └── DATA_DICTIONARY.md           # Exhaustive data dictionary (all tables, columns, constraints, bps)
├── scripts/
│   ├── setup_database.ps1               # Automated PowerShell bootstrap script for Windows
│   └── setup_database.sh                # Automated Bash bootstrap script for Linux/macOS
├── .gitignore                           # Production gitignore (SQLite DBs, WAL journals, logs, OS files)
└── README.md                            # Main project overview & documentation
```

---

## 🏗️ Core Architectural Principles

1. **Offline-First & Multi-Terminal Safe:**
   - Client-generated UUIDs (`TEXT PRIMARY KEY`) prevent ID collisions across disconnected terminals.
   - Recommended: **UUID v7** (time-ordered) for B-tree index locality.
2. **Strict Financial Precision:**
   - Zero floating-point rounding errors. Monetary amounts stored as `INTEGER` in the smallest currency unit (cents, centavos: \$10.50 $\rightarrow$ `1050`).
   - Tax rates stored in basis points (`INTEGER`, $1900 = 19.00\%$, $0 = 0\%$).
3. **Auditability & Kardex Immutability:**
   - No hard deletes on sales or cash drawer movements.
   - Append-only inventory ledger (`inventory_movements`) tracking all additions, deductions, returns, and shrinkage.
4. **Transactional Outbox Pattern:**
   - Atomic staging of events in `sync_outbox` within the same transaction as business data mutations.
5. **SQLite Performance & Durability:**
   - Write-Ahead Logging (`WAL`), `synchronous = NORMAL`, `busy_timeout = 5000`, and `BEGIN IMMEDIATE` transaction semantics.

---

## 🚀 Quickstart & Database Initialization

### Using Bootstrap Scripts
- **Windows (PowerShell):**
  ```powershell
  .\scripts\setup_database.ps1 -DatabasePath vorapos.db
  ```
- **Linux / macOS (Bash):**
  ```bash
  chmod +x scripts/setup_database.sh
  ./scripts/setup_database.sh vorapos.db
  ```

### Manual Execution with SQLite CLI
```bash
# 1. Apply Schema Migration
sqlite3 vorapos.db < database/migrations/v1.0.0_initial_schema.sql

# 2. Apply Master Seeds
sqlite3 vorapos.db < database/seeds/master_seed.sql

# 3. Test Checkout Atomic Transaction
sqlite3 vorapos.db < database/examples/checkout_transaction.sql
```

---

## 📚 Technical Documentation
- [Architecture & Design Decisions](docs/architecture/ARCHITECTURE.md)
- [Cloud Synchronization Protocol](docs/architecture/SYNC_PATTERNS.md)
- [Database Data Dictionary](docs/dictionary/DATA_DICTIONARY.md)
