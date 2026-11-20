-- ============================================================================
-- VoraPOS - DDL Module 1: Users, Roles & Cash Register Shifts
-- Path: database/ddl/01_users_roles_shifts.sql
-- ============================================================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY, -- Client/System UUID v4 or v7
    name TEXT NOT NULL UNIQUE CHECK (name IN ('ADMIN', 'CASHIER', 'SUPERVISOR')),
    permissions_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    pin_hash TEXT, -- Argon2id/Bcrypt hash for rapid terminal authorization
    password_hash TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Physical / Logical Cash Registers
CREATE TABLE IF NOT EXISTS registers (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    code TEXT NOT NULL UNIQUE, -- e.g., 'POS-01'
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Cash Register Shifts / Sessions
CREATE TABLE IF NOT EXISTS register_sessions (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    register_id TEXT NOT NULL REFERENCES registers(id) ON DELETE RESTRICT,
    opened_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    closed_by_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    opening_amount INTEGER NOT NULL CHECK (opening_amount >= 0),
    expected_cash_amount INTEGER CHECK (expected_cash_amount IS NULL OR expected_cash_amount >= 0),
    declared_cash_amount INTEGER CHECK (declared_cash_amount IS NULL OR declared_cash_amount >= 0),
    cash_difference INTEGER, -- Can be positive (overage), negative (shortage), or 0
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    closed_at TEXT CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

-- Cash Drawer In / Out Movements
CREATE TABLE IF NOT EXISTS cash_movements (
    id TEXT PRIMARY KEY, -- Client UUID v4 or v7
    register_session_id TEXT NOT NULL REFERENCES register_sessions(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('CASH_IN', 'CASH_OUT')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);
