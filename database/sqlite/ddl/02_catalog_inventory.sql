-- ============================================================================
-- VoraPOS - DDL Module 2: Products, Taxes & Inventory Ledger (Kardex)
-- Path: database/ddl/02_catalog_inventory.sql
-- ============================================================================

-- Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Tax Rates Definition (Stored in Basis Points: 1900 = 19.00%)
CREATE TABLE IF NOT EXISTS taxes (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    name TEXT NOT NULL,
    rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Products Master Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    tax_id TEXT NOT NULL REFERENCES taxes(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    sale_price INTEGER NOT NULL CHECK (sale_price >= 0),
    unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    track_inventory INTEGER NOT NULL DEFAULT 1 CHECK (track_inventory IN (0, 1)),
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Append-Only Inventory Ledger (Kardex)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SHRINKAGE')),
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta != 0),
    resulting_stock INTEGER NOT NULL,
    reference_id TEXT, -- References sale_id, purchase_id, or adjustment voucher UUID
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);
