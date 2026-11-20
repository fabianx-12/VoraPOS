-- ============================================================================
-- VoraPOS - Production Atomic Checkout Transaction Example
-- Path: database/examples/checkout_transaction.sql
-- Mode: BEGIN IMMEDIATE reserves the write lock up front to prevent SQLITE_BUSY
-- ============================================================================

BEGIN IMMEDIATE;

-- 1. Insert Sales Header ($3.50 total = 350 cents, VAT 19% = 56 cents)
INSERT INTO sales (
    id,
    receipt_number,
    register_session_id,
    user_id,
    customer_id,
    subtotal,
    discount_total,
    tax_total,
    total,
    status,
    created_at
) VALUES (
    's0000001-0000-4000-8000-000000000001',
    'POS01-000000142',
    'rs000001-0000-4000-8000-000000000001',
    'u0000001-0000-4000-8000-000000000001',
    NULL, -- Walk-in retail customer
    294,  -- Net Subtotal before tax in cents
    0,    -- Discount in cents
    56,   -- Total VAT 19% in cents
    350,  -- Gross Total in cents ($3.50)
    'COMPLETED',
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

-- 2. Insert Sale Line Items (Snapshots unit_price & tax at moment of sale)
-- Item A: 1x Mineral Water 500ml ($1.50)
INSERT INTO sale_items (
    id,
    sale_id,
    product_id,
    quantity,
    unit_price,
    line_discount,
    tax_amount,
    line_total
) VALUES (
    'si000001-0000-4000-8000-000000000001',
    's0000001-0000-4000-8000-000000000001',
    'p0000001-0000-4000-8000-000000000001',
    1,
    150,
    0,
    24, -- 19% tax portion in cents
    150
);

-- Item B: 1x Sparkling Lemon Soda 330ml ($2.00)
INSERT INTO sale_items (
    id,
    sale_id,
    product_id,
    quantity,
    unit_price,
    line_discount,
    tax_amount,
    line_total
) VALUES (
    'si000001-0000-4000-8000-000000000002',
    's0000001-0000-4000-8000-000000000001',
    'p0000001-0000-4000-8000-000000000002',
    1,
    200,
    0,
    32, -- 19% tax portion in cents
    200
);

-- 3. Record Payment (Exact cash payment of $3.50)
INSERT INTO sale_payments (
    id,
    sale_id,
    method,
    amount,
    transaction_reference,
    created_at
) VALUES (
    'sp000001-0000-4000-8000-000000000001',
    's0000001-0000-4000-8000-000000000001',
    'CASH',
    350,
    'CASH-EXACT',
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

-- 4. Atomic Inventory Stock Deduction
UPDATE products
SET
    current_stock = current_stock - 1,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE id = 'p0000001-0000-4000-8000-000000000001'
  AND track_inventory = 1;

UPDATE products
SET
    current_stock = current_stock - 1,
    updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE id = 'p0000001-0000-4000-8000-000000000002'
  AND track_inventory = 1;

-- 5. Append-Only Inventory Ledger (Kardex) Entries
INSERT INTO inventory_movements (
    id,
    product_id,
    user_id,
    type,
    quantity_delta,
    resulting_stock,
    reference_id,
    notes,
    created_at
) VALUES (
    'im000001-0000-4000-8000-000000000001',
    'p0000001-0000-4000-8000-000000000001',
    'u0000001-0000-4000-8000-000000000001',
    'SALE',
    -1,
    (SELECT current_stock FROM products WHERE id = 'p0000001-0000-4000-8000-000000000001'),
    's0000001-0000-4000-8000-000000000001',
    'Sale receipt POS01-000000142',
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

INSERT INTO inventory_movements (
    id,
    product_id,
    user_id,
    type,
    quantity_delta,
    resulting_stock,
    reference_id,
    notes,
    created_at
) VALUES (
    'im000001-0000-4000-8000-000000000002',
    'p0000001-0000-4000-8000-000000000002',
    'u0000001-0000-4000-8000-000000000001',
    'SALE',
    -1,
    (SELECT current_stock FROM products WHERE id = 'p0000001-0000-4000-8000-000000000002'),
    's0000001-0000-4000-8000-000000000001',
    'Sale receipt POS01-000000142',
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

-- 6. Enqueue Fiscal Document Generation/Submission
INSERT INTO fiscal_documents (
    id,
    sale_id,
    document_type,
    submission_status,
    retry_count,
    updated_at
) VALUES (
    'fd000001-0000-4000-8000-000000000001',
    's0000001-0000-4000-8000-000000000001',
    'POS_TICKET',
    'PENDING',
    0,
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

-- 7. Transactional Outbox Pattern: Enqueue Sale Event for Background Cloud Sync
INSERT INTO sync_outbox (
    entity_name,
    entity_id,
    operation,
    payload_json,
    status,
    retry_count,
    created_at
) VALUES (
    'sales',
    's0000001-0000-4000-8000-000000000001',
    'INSERT',
    JSON_OBJECT(
        'id', 's0000001-0000-4000-8000-000000000001',
        'receipt_number', 'POS01-000000142',
        'register_session_id', 'rs000001-0000-4000-8000-000000000001',
        'user_id', 'u0000001-0000-4000-8000-000000000001',
        'subtotal', 294,
        'tax_total', 56,
        'total', 350,
        'status', 'COMPLETED',
        'items', JSON_ARRAY(
            JSON_OBJECT('product_id', 'p0000001-0000-4000-8000-000000000001', 'qty', 1, 'price', 150),
            JSON_OBJECT('product_id', 'p0000001-0000-4000-8000-000000000002', 'qty', 1, 'price', 200)
        ),
        'payments', JSON_ARRAY(
            JSON_OBJECT('method', 'CASH', 'amount', 350)
        )
    ),
    'PENDING',
    0,
    STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
);

COMMIT;
