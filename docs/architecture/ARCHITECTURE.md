# VoraPOS - System Architecture & Database Design

## 1. Architectural Overview

VoraPOS is an **offline-first, multi-terminal desktop Point of Sale (POS)** system designed to operate autonomously during network disruptions and seamlessly synchronize with an upstream PostgreSQL cluster when connectivity is established.

```
+-------------------------------------------------------------------------------+
|                       LOCAL OFFLINE TERMINAL (SQLite)                         |
|                                                                               |
|  +------------------------+      +------------------+      +---------------+  |
|  | POS Checkout Interface | ---> | SQLite DB (WAL)  | ---> | Kardex Ledger |  |
|  +------------------------+      +--------+---------+      +---------------+  |
|                                           |                                   |
|                                           v                                   |
|                                +---------------------+                        |
|                                | sync_outbox (FIFO)  |                        |
|                                +----------+----------+                        |
+-------------------------------------------|-----------------------------------+
                                            | (Background Replay Worker)
                                            v
+-------------------------------------------------------------------------------+
|                         CENTRAL CLOUD (PostgreSQL)                            |
|                                                                               |
|            Master Transactions | Central Reporting | Multi-Store Sync         |
+-------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### A. Client-Side UUID Primary Keys
- **The Problem:** Sequential autoincrement IDs (`1, 2, 3...`) conflict catastrophically when multiple terminals record sales offline simultaneously.
- **The Solution:** Every entity uses client-generated RFC 4122 UUIDs (`TEXT PRIMARY KEY`).
- **Index Locality:** While standard UUID v4 is supported, client libraries are encouraged to generate **UUID v7** (Unix timestamp prefix) to maintain monotonic B-tree index locality and reduce write amplification.

### B. Fixed-Point Financial Precision
- **No Floating-Point Storage:** Floats and doubles produce non-deterministic rounding errors ($0.1 + 0.2 \neq 0.3$).
- **Currency:** Stored as `INTEGER` representing the smallest fiat currency denomination (e.g., cents, centavos: \$10.50 $\rightarrow$ `1050`).
- **Tax Rates in Basis Points (bps):** $1\text{ bps} = 0.01\%$. A $19.00\%$ tax is stored as `1900`.

### C. Immutability & Append-Only Kardex
- Hard deletions are prohibited on business records.
- Sales cancellations transition `status` to `'VOIDED'` and mandate audit metadata (`void_reason`, `voided_by_user_id`, `voided_at`).
- All inventory adjustments are recorded in `inventory_movements` (Kardex), guaranteeing complete stock reconciliation.

### D. SQLite Concurrency (WAL Mode & Pragmas)
- **WAL Journaling:** `PRAGMA journal_mode = WAL;` allows simultaneous readers and 1 writer without blocking.
- **Immediate Transactions:** Transactions writing to business records and the outbox must invoke `BEGIN IMMEDIATE;` to reserve the write lock and prevent mid-transaction `SQLITE_BUSY` contention.
