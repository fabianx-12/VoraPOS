-- ============================================================================
-- VoraPOS Seed 02: Default Registers & Tax Rates (in Basis Points)
-- Path: database/seeds/02_registers_taxes.sql
-- ============================================================================

INSERT INTO registers (id, code, name, is_active, created_at)
VALUES (
    'r0000001-0000-4000-8000-000000000001',
    'POS-01',
    'Main Checkout Counter',
    1,
    '2026-11-20T00:00:00.000Z'
);

-- Tax Rates (0% Exempt and 19% Standard in basis points)
INSERT INTO taxes (id, name, rate_bps, is_active, created_at)
VALUES
    (
        't0000001-0000-4000-8000-000000000001',
        'VAT 0% (Exempt)',
        0, -- 0 bps = 0.00%
        1,
        '2026-11-20T00:00:00.000Z'
    ),
    (
        't0000001-0000-4000-8000-000000000002',
        'VAT 19% (Standard)',
        1900, -- 1900 bps = 19.00%
        1,
        '2026-11-20T00:00:00.000Z'
    );
