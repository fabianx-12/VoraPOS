-- ============================================================================
-- VoraPOS - Production Connection Pragmas
-- Path: database/config/sqlite_pragmas.sql
-- Note: Must be executed on EVERY new SQLite database connection opening.
-- ============================================================================

-- Enforce relational foreign key constraints (disabled by default in SQLite)
PRAGMA foreign_keys = ON;

-- Write-Ahead Logging allows concurrent readers and 1 writer without blocking
PRAGMA journal_mode = WAL;

-- Safe durability mode with drastically improved write throughput under WAL
PRAGMA synchronous = NORMAL;

-- Milliseconds to wait before returning SQLITE_BUSY on lock contention
PRAGMA busy_timeout = 5000;

-- Store temporary tables, indices, and sort caches in memory
PRAGMA temp_store = MEMORY;

-- Text encoding for all string storage
PRAGMA encoding = 'UTF-8';
