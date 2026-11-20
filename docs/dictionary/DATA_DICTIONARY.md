# VoraPOS - Database Data Dictionary

Comprehensive technical dictionary of tables, column definitions, constraints, and precision requirements for the VoraPOS SQLite database.

---

## 1. Module: Users, Roles & Cash Register Shifts

### `roles`
System access tiers and permission definitions.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `name` (`TEXT NOT NULL UNIQUE`): Role name (`ADMIN`, `CASHIER`, `SUPERVISOR`).
- `permissions_json` (`TEXT NOT NULL DEFAULT '{}'`): JSON object or array of granular capabilities.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `users`
Terminal operators and administrative accounts.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `role_id` (`TEXT NOT NULL REFERENCES roles(id)`): Foreign key to assigned role.
- `full_name` (`TEXT NOT NULL`): Operator display name.
- `pin_hash` (`TEXT`): Argon2id or Bcrypt hash for fast touch-screen lock switching.
- `password_hash` (`TEXT NOT NULL`): Secure password hash for administrator access.
- `is_active` (`INTEGER NOT NULL CHECK (is_active IN (0, 1))`): Account status flag.
- `created_at`, `updated_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamps.

### `registers`
Physical POS devices or workstations.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `code` (`TEXT NOT NULL UNIQUE`): Human-readable terminal code (e.g., `POS-01`).
- `name` (`TEXT NOT NULL`): Terminal description (e.g., `Main Checkout Counter`).
- `is_active` (`INTEGER NOT NULL CHECK (is_active IN (0, 1))`): Status flag.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `register_sessions`
Cashier shifts from opening drawer to end-of-day balance closing.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `register_id` (`TEXT NOT NULL REFERENCES registers(id)`): Active cash terminal.
- `opened_by_user_id` (`TEXT NOT NULL REFERENCES users(id)`): Cashier opening shift.
- `closed_by_user_id` (`TEXT REFERENCES users(id)`): Cashier closing shift (nullable while open).
- `opening_amount` (`INTEGER NOT NULL CHECK (opening_amount >= 0)`): Opening float in cents.
- `expected_cash_amount` (`INTEGER`): Calculated cash expected based on sales + cash_in - cash_out.
- `declared_cash_amount` (`INTEGER`): Physical cash counted by cashier at closing.
- `cash_difference` (`INTEGER`): Discrepancy in cents (positive = surplus, negative = shortage).
- `status` (`TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED'))`): Session state.
- `opened_at`, `closed_at` (`TEXT`): Shift timestamps.

### `cash_movements`
Audited manual cash drawer inputs and outputs (safe drops, petty cash, payouts).
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `register_session_id` (`TEXT NOT NULL REFERENCES register_sessions(id)`): Active shift.
- `user_id` (`TEXT NOT NULL REFERENCES users(id)`): Operator performing movement.
- `type` (`TEXT NOT NULL CHECK (type IN ('CASH_IN', 'CASH_OUT'))`): Direction of funds.
- `amount` (`INTEGER NOT NULL CHECK (amount > 0)`): Amount transferred in cents.
- `reason` (`TEXT NOT NULL`): Business reason for movement.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

---

## 2. Module: Products, Taxes & Kardex

### `categories`
Hierarchical product grouping.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `name` (`TEXT NOT NULL UNIQUE`): Category name.
- `is_active` (`INTEGER NOT NULL DEFAULT 1`): Status flag.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `taxes`
Tax rules stored in Basis Points.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `name` (`TEXT NOT NULL`): Tax title (e.g., `VAT 19% (Standard)`).
- `rate_bps` (`INTEGER NOT NULL CHECK (rate_bps >= 0)`): Rate in basis points ($1900 = 19.00\%$).
- `is_active` (`INTEGER NOT NULL DEFAULT 1`): Status flag.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `products`
Master catalog items and current stock levels.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `category_id` (`TEXT NOT NULL REFERENCES categories(id)`): Category relationship.
- `tax_id` (`TEXT NOT NULL REFERENCES taxes(id)`): Applicable tax rate.
- `sku` (`TEXT NOT NULL UNIQUE`): Internal stock keeping unit code.
- `barcode` (`TEXT`): UPC / EAN scanner barcode (indexed).
- `name` (`TEXT NOT NULL`): Commercial product title.
- `sale_price` (`INTEGER NOT NULL CHECK (sale_price >= 0)`): Retail price in cents.
- `unit_cost` (`INTEGER NOT NULL CHECK (unit_cost >= 0)`): Average cost in cents.
- `track_inventory` (`INTEGER NOT NULL CHECK (track_inventory IN (0, 1))`): Inventory tracking toggle.
- `current_stock` (`INTEGER NOT NULL DEFAULT 0`): Current on-hand quantity.
- `min_stock` (`INTEGER NOT NULL DEFAULT 0`): Low stock threshold alert.
- `is_active` (`INTEGER NOT NULL DEFAULT 1`): Availability status.
- `created_at`, `updated_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamps.

### `inventory_movements`
Append-only Kardex ledger recording every stock variation.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `product_id` (`TEXT NOT NULL REFERENCES products(id)`): Mutated product.
- `user_id` (`TEXT NOT NULL REFERENCES users(id)`): Responsible user.
- `type` (`TEXT NOT NULL CHECK (type IN ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SHRINKAGE'))`): Movement type.
- `quantity_delta` (`INTEGER NOT NULL CHECK (quantity_delta != 0)`): Stock change (+ or -).
- `resulting_stock` (`INTEGER NOT NULL`): Stock snapshot immediately following mutation.
- `reference_id` (`TEXT`): Related entity UUID (e.g., `sale_id`, purchase order).
- `notes` (`TEXT`): Audit explanation.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

---

## 3. Module: Customers, Sales & Invoicing

### `customers`
Customer entity for invoicing and loyalty.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `tax_id_number` (`TEXT UNIQUE`): National fiscal identification.
- `full_name` (`TEXT NOT NULL`): Customer name.
- `phone`, `email` (`TEXT`): Contact details.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `sales`
Sales transaction header.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `receipt_number` (`TEXT NOT NULL UNIQUE`): Terminal-scoped sequential ticket number.
- `register_session_id` (`TEXT NOT NULL REFERENCES register_sessions(id)`): Shift reference.
- `user_id` (`TEXT NOT NULL REFERENCES users(id)`): Cashier.
- `customer_id` (`TEXT REFERENCES customers(id)`): Customer (nullable for walk-ins).
- `subtotal` (`INTEGER NOT NULL`): Pre-tax net total in cents.
- `discount_total` (`INTEGER NOT NULL DEFAULT 0`): Total discounts applied in cents.
- `tax_total` (`INTEGER NOT NULL DEFAULT 0`): Total computed taxes in cents.
- `total` (`INTEGER NOT NULL`): Gross total payable in cents.
- `status` (`TEXT NOT NULL CHECK (status IN ('COMPLETED', 'VOIDED'))`): Sale status.
- `void_reason` (`TEXT`): Required if status is `VOIDED`.
- `voided_by_user_id` (`TEXT REFERENCES users(id)`): Supervisor authorising void.
- `created_at`, `voided_at` (`TEXT`): Timestamps.

### `sale_items`
Individual line items within a sale.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `sale_id` (`TEXT NOT NULL REFERENCES sales(id)`): Parent sale.
- `product_id` (`TEXT NOT NULL REFERENCES products(id)`): Sold product.
- `quantity` (`INTEGER NOT NULL CHECK (quantity > 0)`): Units purchased.
- `unit_price` (`INTEGER NOT NULL`): Historical price snapshot at sale time.
- `line_discount` (`INTEGER NOT NULL DEFAULT 0`): Line-level discount in cents.
- `tax_amount` (`INTEGER NOT NULL DEFAULT 0`): Calculated tax in cents.
- `line_total` (`INTEGER NOT NULL`): Final line total in cents.

### `sale_payments`
Payment distribution supporting split tenders.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `sale_id` (`TEXT NOT NULL REFERENCES sales(id)`): Parent sale.
- `method` (`TEXT NOT NULL CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'OTHER'))`): Tender type.
- `amount` (`INTEGER NOT NULL CHECK (amount > 0)`): Payment amount in cents.
- `transaction_reference` (`TEXT`): Voucher, auth code, or transfer ID.
- `created_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.

### `fiscal_documents`
Electronic invoice transmission state.
- `id` (`TEXT PRIMARY KEY`): Unique UUID.
- `sale_id` (`TEXT NOT NULL UNIQUE REFERENCES sales(id)`): 1-to-1 sale linkage.
- `document_type` (`TEXT NOT NULL CHECK (document_type IN ('POS_TICKET', 'ELECTRONIC_INVOICE', 'EQUIVALENT_DOC'))`): Document type.
- `submission_status` (`TEXT NOT NULL CHECK (submission_status IN ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED'))`): Tax authority status.
- `fiscal_uuid_or_cufe` (`TEXT`): Electronic tax stamp / digital seal.
- `last_error` (`TEXT`): Rejection diagnostic message.
- `retry_count` (`INTEGER NOT NULL DEFAULT 0`): Transmission attempt counter.
- `updated_at` (`TEXT NOT NULL`): Timestamp.

---

## 4. Module: Offline-First Synchronization

### `sync_outbox`
Transactional outbox queue.
- `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`): Monotonic ordering index.
- `entity_name` (`TEXT NOT NULL`): Table name (`sales`, `inventory_movements`, etc.).
- `entity_id` (`TEXT NOT NULL`): UUID of updated entity.
- `operation` (`TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'VOID'))`): Operation type.
- `payload_json` (`TEXT NOT NULL`): Full JSON payload.
- `status` (`TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED'))`): Sync state.
- `retry_count` (`INTEGER NOT NULL DEFAULT 0`): Sync attempt counter.
- `last_error` (`TEXT`): Sync failure description.
- `created_at`, `synced_at` (`TEXT`): Timestamps.

### `sync_checkpoints`
High-water marks for pulling inbound updates from cloud PostgreSQL.
- `entity_name` (`TEXT PRIMARY KEY`): Entity name (`products`, `categories`, etc.).
- `last_synced_at` (`TEXT NOT NULL`): ISO-8601 UTC timestamp.
- `server_cursor` (`TEXT`): LSN or cloud revision marker.
