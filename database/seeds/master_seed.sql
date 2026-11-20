-- ============================================================================
-- VoraPOS - Master Seed Script (Consolidated)
-- Path: database/seeds/master_seed.sql
-- Executes: 01_roles_admin.sql -> 02_registers_taxes.sql -> 03_catalog_products.sql -> 04_initial_kardex.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Roles & Default Admin
INSERT INTO roles (id, name, permissions_json, created_at)
VALUES
    ('e1a7b001-0000-4000-8000-000000000001', 'ADMIN', '{"all": true}', '2026-11-20T00:00:00.000Z'),
    ('e1a7b001-0000-4000-8000-000000000002', 'SUPERVISOR', '{"sales": ["create", "void"], "cash": ["audit"], "inventory": ["adjust"]}', '2026-11-20T00:00:00.000Z'),
    ('e1a7b001-0000-4000-8000-000000000003', 'CASHIER', '{"sales": ["create"], "cash": ["open", "close"]}', '2026-11-20T00:00:00.000Z');

INSERT INTO users (id, role_id, full_name, pin_hash, password_hash, is_active, created_at)
VALUES (
    'u0000001-0000-4000-8000-000000000001',
    'e1a7b001-0000-4000-8000-000000000001',
    'System Administrator',
    '$2b$12$e8Yy8sL2gV9qS0oK7YtNuebZ7V2J.2jUa5.y2H.W4k8y8L2gV9qS0',
    '$2b$12$uA89dksLjke29381kld09eZ9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j',
    1,
    '2026-11-20T00:00:00.000Z'
);

-- 2. Register & Taxes
INSERT INTO registers (id, code, name, is_active, created_at)
VALUES ('r0000001-0000-4000-8000-000000000001', 'POS-01', 'Main Checkout Counter', 1, '2026-11-20T00:00:00.000Z');

INSERT INTO taxes (id, name, rate_bps, is_active, created_at)
VALUES
    ('t0000001-0000-4000-8000-000000000001', 'VAT 0% (Exempt)', 0, 1, '2026-11-20T00:00:00.000Z'),
    ('t0000001-0000-4000-8000-000000000002', 'VAT 19% (Standard)', 1900, 1, '2026-11-20T00:00:00.000Z');

-- 3. Categories & Products
INSERT INTO categories (id, name, is_active, created_at)
VALUES
    ('c0000001-0000-4000-8000-000000000001', 'Beverages', 1, '2026-11-20T00:00:00.000Z'),
    ('c0000001-0000-4000-8000-000000000002', 'Groceries & Pantry', 1, '2026-11-20T00:00:00.000Z'),
    ('c0000001-0000-4000-8000-000000000003', 'Bakery & Snacks', 1, '2026-11-20T00:00:00.000Z');

INSERT INTO products (
    id, category_id, tax_id, sku, barcode, name,
    sale_price, unit_cost, track_inventory, current_stock, min_stock, is_active, created_at, updated_at
)
VALUES
    ('p0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 't0000001-0000-4000-8000-000000000002',
     'BEV-WAT-001', '7701234567890', 'Natural Mineral Water 500ml', 150, 70, 1, 100, 20, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
    ('p0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 't0000001-0000-4000-8000-000000000002',
     'BEV-SOD-001', '7701234567891', 'Sparkling Lemon Soda 330ml Can', 200, 95, 1, 80, 20, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
    ('p0000001-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000002', 't0000001-0000-4000-8000-000000000001',
     'GRO-RIC-001', '7701234567892', 'Organic Whole Brown Rice 1kg', 320, 180, 1, 60, 15, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
    ('p0000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000002', 't0000001-0000-4000-8000-000000000002',
     'GRO-COF-001', '7701234567893', 'Artisan Roasted Ground Coffee 500g', 890, 450, 1, 45, 10, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
    ('p0000001-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000003', 't0000001-0000-4000-8000-000000000001',
     'BAK-SOU-001', '7701234567894', 'Fresh Artisan Sourdough Loaf 750g', 450, 210, 1, 25, 5, 1, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z');

-- 4. Initial Kardex
INSERT INTO inventory_movements (id, product_id, user_id, type, quantity_delta, resulting_stock, reference_id, notes, created_at)
VALUES
    ('m0000001-0000-4000-8000-000000000001', 'p0000001-0000-4000-8000-000000000001', 'u0000001-0000-4000-8000-000000000001', 'PURCHASE', 100, 100, 'INIT-PO-001', 'Initial inventory balance setup', '2026-11-20T00:00:00.000Z'),
    ('m0000001-0000-4000-8000-000000000002', 'p0000001-0000-4000-8000-000000000002', 'u0000001-0000-4000-8000-000000000001', 'PURCHASE', 80, 80, 'INIT-PO-001', 'Initial inventory balance setup', '2026-11-20T00:00:00.000Z'),
    ('m0000001-0000-4000-8000-000000000003', 'p0000001-0000-4000-8000-000000000003', 'u0000001-0000-4000-8000-000000000001', 'PURCHASE', 60, 60, 'INIT-PO-001', 'Initial inventory balance setup', '2026-11-20T00:00:00.000Z'),
    ('m0000001-0000-4000-8000-000000000004', 'p0000001-0000-4000-8000-000000000004', 'u0000001-0000-4000-8000-000000000001', 'PURCHASE', 45, 45, 'INIT-PO-001', 'Initial inventory balance setup', '2026-11-20T00:00:00.000Z'),
    ('m0000001-0000-4000-8000-000000000005', 'p0000001-0000-4000-8000-000000000005', 'u0000001-0000-4000-8000-000000000001', 'PURCHASE', 25, 25, 'INIT-PO-001', 'Initial inventory balance setup', '2026-11-20T00:00:00.000Z');
