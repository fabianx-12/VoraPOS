-- ============================================================================
-- VoraPOS - Production Cloud PostgreSQL Seed Data
-- Path: database/seeds/postgres_cloud_seeds.sql
-- ============================================================================

INSERT INTO roles (id, name, permissions_json)
VALUES
    ('e1a7b001-0000-4000-8000-000000000001', 'ADMIN', '{"all": true}'::jsonb),
    ('e1a7b001-0000-4000-8000-000000000002', 'SUPERVISOR', '{"sales": ["create", "void"], "cash": ["audit"], "inventory": ["adjust"]}'::jsonb),
    ('e1a7b001-0000-4000-8000-000000000003', 'CASHIER', '{"sales": ["create"], "cash": ["open", "close"]}'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (id, role_id, full_name, pin_hash, password_hash, is_active)
VALUES (
    'u0000001-0000-4000-8000-000000000001',
    'e1a7b001-0000-4000-8000-000000000001',
    'System Administrator',
    '$2b$12$e8Yy8sL2gV9qS0oK7YtNuebZ7V2J.2jUa5.y2H.W4k8y8L2gV9qS0',
    '$2b$12$uA89dksLjke29381kld09eZ9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO registers (id, code, name, is_active)
VALUES ('r0000001-0000-4000-8000-000000000001', 'POS-01', 'Main Checkout Counter', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO taxes (id, name, rate_bps, is_active)
VALUES
    ('t0000001-0000-4000-8000-000000000001', 'VAT 0% (Exempt)', 0, TRUE),
    ('t0000001-0000-4000-8000-000000000002', 'VAT 19% (Standard)', 1900, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, is_active)
VALUES
    ('c0000001-0000-4000-8000-000000000001', 'Beverages', TRUE),
    ('c0000001-0000-4000-8000-000000000002', 'Groceries & Pantry', TRUE),
    ('c0000001-0000-4000-8000-000000000003', 'Bakery & Snacks', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (
    id, category_id, tax_id, sku, barcode, name,
    sale_price, unit_cost, track_inventory, current_stock, min_stock, is_active
)
VALUES
    ('p0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 't0000001-0000-4000-8000-000000000002',
     'BEV-WAT-001', '7701234567890', 'Natural Mineral Water 500ml', 150, 70, TRUE, 100, 20, TRUE),
    ('p0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 't0000001-0000-4000-8000-000000000002',
     'BEV-SOD-001', '7701234567891', 'Sparkling Lemon Soda 330ml Can', 200, 95, TRUE, 80, 20, TRUE),
    ('p0000001-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000002', 't0000001-0000-4000-8000-000000000001',
     'GRO-RIC-001', '7701234567892', 'Organic Whole Brown Rice 1kg', 320, 180, TRUE, 60, 15, TRUE),
    ('p0000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000002', 't0000001-0000-4000-8000-000000000002',
     'GRO-COF-001', '7701234567893', 'Artisan Roasted Ground Coffee 500g', 890, 450, TRUE, 45, 10, TRUE),
    ('p0000001-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000003', 't0000001-0000-4000-8000-000000000001',
     'BAK-SOU-001', '7701234567894', 'Fresh Artisan Sourdough Loaf 750g', 450, 210, TRUE, 25, 5, TRUE)
ON CONFLICT (id) DO NOTHING;
