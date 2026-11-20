-- ============================================================================
-- VoraPOS Seed 04: Initial Inventory Ledger (Kardex) Baseline Entries
-- Path: database/seeds/04_initial_kardex.sql
-- Audit Rule: Every existing stock balance MUST have a ledger origin record.
-- ============================================================================

INSERT INTO inventory_movements (
    id, product_id, user_id, type, quantity_delta, resulting_stock, reference_id, notes, created_at
)
VALUES
    (
        'm0000001-0000-4000-8000-000000000001',
        'p0000001-0000-4000-8000-000000000001',
        'u0000001-0000-4000-8000-000000000001',
        'PURCHASE', 100, 100, 'INIT-PO-001', 'Initial inventory balance setup',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'm0000001-0000-4000-8000-000000000002',
        'p0000001-0000-4000-8000-000000000002',
        'u0000001-0000-4000-8000-000000000001',
        'PURCHASE', 80, 80, 'INIT-PO-001', 'Initial inventory balance setup',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'm0000001-0000-4000-8000-000000000003',
        'p0000001-0000-4000-8000-000000000003',
        'u0000001-0000-4000-8000-000000000001',
        'PURCHASE', 60, 60, 'INIT-PO-001', 'Initial inventory balance setup',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'm0000001-0000-4000-8000-000000000004',
        'p0000001-0000-4000-8000-000000000004',
        'u0000001-0000-4000-8000-000000000001',
        'PURCHASE', 45, 45, 'INIT-PO-001', 'Initial inventory balance setup',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'm0000001-0000-4000-8000-000000000005',
        'p0000001-0000-4000-8000-000000000005',
        'u0000001-0000-4000-8000-000000000001',
        'PURCHASE', 25, 25, 'INIT-PO-001', 'Initial inventory balance setup',
        '2026-11-20T00:00:00.000Z'
    );
