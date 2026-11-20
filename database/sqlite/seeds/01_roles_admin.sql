-- ============================================================================
-- VoraPOS Seed 01: System Roles & Default Administrator
-- Path: database/seeds/01_roles_admin.sql
-- ============================================================================

INSERT INTO roles (id, name, permissions_json, created_at)
VALUES
    (
        'e1a7b001-0000-4000-8000-000000000001',
        'ADMIN',
        '{"all": true, "sales": ["create", "read", "void"], "inventory": ["manage"], "reports": ["view"], "users": ["manage"], "cash": ["manage"]}',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'e1a7b001-0000-4000-8000-000000000002',
        'SUPERVISOR',
        '{"sales": ["create", "read", "void"], "inventory": ["read", "adjust"], "reports": ["view"], "cash": ["open", "close", "audit"]}',
        '2026-11-20T00:00:00.000Z'
    ),
    (
        'e1a7b001-0000-4000-8000-000000000003',
        'CASHIER',
        '{"sales": ["create", "read"], "cash": ["open", "close", "drop"], "inventory": ["read"]}',
        '2026-11-20T00:00:00.000Z'
    );

-- Default Admin User (Password: Admin123! | PIN: 1234)
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
