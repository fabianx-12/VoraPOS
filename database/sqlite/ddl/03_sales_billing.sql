-- ============================================================================
-- VoraPOS - DDL Module 3: Customers, Sales, Payments & Fiscal Invoicing
-- Path: database/ddl/03_sales_billing.sql
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    tax_id_number TEXT UNIQUE, -- Government Fiscal ID / SSN / NIT / RUT
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Sales Orders Header
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    receipt_number TEXT NOT NULL UNIQUE, -- Terminal prefixed sequence (e.g. POS01-00000001)
    register_session_id TEXT NOT NULL REFERENCES register_sessions(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    discount_total INTEGER NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    tax_total INTEGER NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOIDED')),
    void_reason TEXT,
    voided_by_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    voided_at TEXT,
    CHECK (
        (status = 'COMPLETED' AND void_reason IS NULL AND voided_by_user_id IS NULL AND voided_at IS NULL) OR
        (status = 'VOIDED' AND void_reason IS NOT NULL AND voided_by_user_id IS NOT NULL AND voided_at IS NOT NULL)
    )
);

-- Sale Line Items
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0), -- Snapshot at sale time
    line_discount INTEGER NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
    tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0)
);

-- Split Payment Records
CREATE TABLE IF NOT EXISTS sale_payments (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    method TEXT NOT NULL CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'OTHER')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    transaction_reference TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Fiscal Documents (Electronic Invoicing / DIAN / SAT / IRS Compliant)
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    sale_id TEXT NOT NULL UNIQUE REFERENCES sales(id) ON DELETE RESTRICT,
    document_type TEXT NOT NULL CHECK (document_type IN ('POS_TICKET', 'ELECTRONIC_INVOICE', 'EQUIVALENT_DOC')),
    submission_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (submission_status IN ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED')),
    fiscal_uuid_or_cufe TEXT,
    last_error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);
