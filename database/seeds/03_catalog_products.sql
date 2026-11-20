-- ============================================================================
-- VoraPOS Seed 03: Product Categories & Retail Catalog
-- Path: database/seeds/03_catalog_products.sql
-- Precision: Prices and Unit Costs in Smallest Currency Units (Cents)
-- ============================================================================

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
    -- Product 1: Mineral Water 500ml ($1.50 = 150 cents, Cost: $0.70 = 70 cents, Tax: 19%)
    (
        'p0000001-0000-4000-8000-000000000001',
        'c0000001-0000-4000-8000-000000000001', -- Beverages
        't0000001-0000-4000-8000-000000000002', -- 19%
        'BEV-WAT-001',
        '7701234567890',
        'Natural Mineral Water 500ml',
        150, 70, 1, 100, 20, 1,
        '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'
    ),
    -- Product 2: Sparkling Soda 330ml ($2.00 = 200 cents, Cost: $0.95 = 95 cents, Tax: 19%)
    (
        'p0000001-0000-4000-8000-000000000002',
        'c0000001-0000-4000-8000-000000000001', -- Beverages
        't0000001-0000-4000-8000-000000000002', -- 19%
        'BEV-SOD-001',
        '7701234567891',
        'Sparkling Lemon Soda 330ml Can',
        200, 95, 1, 80, 20, 1,
        '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'
    ),
    -- Product 3: Organic Brown Rice 1kg ($3.20 = 320 cents, Cost: $1.80 = 180 cents, Tax: 0% Exempt)
    (
        'p0000001-0000-4000-8000-000000000003',
        'c0000001-0000-4000-8000-000000000002', -- Groceries & Pantry
        't0000001-0000-4000-8000-000000000001', -- 0%
        'GRO-RIC-001',
        '7701234567892',
        'Organic Whole Brown Rice 1kg',
        320, 180, 1, 60, 15, 1,
        '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'
    ),
    -- Product 4: Premium Ground Coffee 500g ($8.90 = 890 cents, Cost: $4.50 = 450 cents, Tax: 19%)
    (
        'p0000001-0000-4000-8000-000000000004',
        'c0000001-0000-4000-8000-000000000002', -- Groceries & Pantry
        't0000001-0000-4000-8000-000000000002', -- 19%
        'GRO-COF-001',
        '7701234567893',
        'Artisan Roasted Ground Coffee 500g',
        890, 450, 1, 45, 10, 1,
        '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'
    ),
    -- Product 5: Artisan Sourdough Bread ($4.50 = 450 cents, Cost: $2.10 = 210 cents, Tax: 0% Exempt)
    (
        'p0000001-0000-4000-8000-000000000005',
        'c0000001-0000-4000-8000-000000000003', -- Bakery & Snacks
        't0000001-0000-4000-8000-000000000001', -- 0%
        'BAK-SOU-001',
        '7701234567894',
        'Fresh Artisan Sourdough Loaf 750g',
        450, 210, 1, 25, 5, 1,
        '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'
    );
