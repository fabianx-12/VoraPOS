-- ============================================================================
-- VoraPOS - Performance & Audit Indexes
-- Path: database/ddl/05_indexes.sql
-- ============================================================================

-- Users & Shifts Foreign Key & High-Frequency Indexes
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_pin_hash ON users(pin_hash) WHERE pin_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_register_sessions_register_id ON register_sessions(register_id);
CREATE INDEX IF NOT EXISTS idx_register_sessions_opened_by ON register_sessions(opened_by_user_id);
CREATE INDEX IF NOT EXISTS idx_register_sessions_status ON register_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session_id ON cash_movements(register_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_user_id ON cash_movements(user_id);

-- Product Catalog & Kardex Indexes (Fast POS Lookups)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_tax_id ON products(tax_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_id ON inventory_movements(reference_id) WHERE reference_id IS NOT NULL;

-- Sales, Items & Payments Indexes
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_register_session_id ON sales(register_session_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_status ON fiscal_documents(submission_status);

-- Sync Outbox Queue Partial Index (Ultra-fast FIFO polling for offline syncer)
CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending ON sync_outbox(id ASC) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_created ON sync_outbox(status, created_at);
