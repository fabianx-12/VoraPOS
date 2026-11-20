-- ============================================================================
-- VoraPOS - DDL Module 4: Transactional Outbox & Sync Checkpoints
-- Path: database/ddl/04_sync_outbox.sql
-- ============================================================================

-- Transactional Outbox Pattern for Resilient Offline-First Cloud Sync
CREATE TABLE IF NOT EXISTS sync_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Strictly monotonic integer sequence for FIFO delivery
    entity_name TEXT NOT NULL, -- e.g., 'sales', 'inventory_movements', 'cash_movements'
    entity_id TEXT NOT NULL, -- UUID of the entity being synchronized
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'VOID')),
    payload_json TEXT NOT NULL, -- Full entity payload snapshot
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    synced_at TEXT
);

-- Inbound Sync Checkpoints (Stores High-Water Marks from Central Cloud Server)
CREATE TABLE IF NOT EXISTS sync_checkpoints (
    entity_name TEXT PRIMARY KEY, -- e.g., 'products', 'categories', 'taxes', 'customers'
    last_synced_at TEXT NOT NULL,
    server_cursor TEXT -- Server-provided transaction timestamp or commit LSN
);
