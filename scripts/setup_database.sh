#!/usr/bin/env bash
# ============================================================================
# VoraPOS - Database Bootstrap Script (Bash)
# Path: scripts/setup_database.sh
# Usage: ./scripts/setup_database.sh [database_file.db]
# ============================================================================

set -euo pipefail

DB_PATH="${1:-vorapos.db}"

echo "==> Initializing VoraPOS SQLite Database at: ${DB_PATH}"

if ! command -v sqlite3 &> /dev/null; then
    echo "ERROR: sqlite3 command not found. Please install sqlite3." >&2
    exit 1
fi

echo "--> Applying Migration: v1.0.0_initial_schema.sql"
sqlite3 "${DB_PATH}" < "database/migrations/v1.0.0_initial_schema.sql"

echo "--> Seeding Baseline Data: master_seed.sql"
sqlite3 "${DB_PATH}" < "database/seeds/master_seed.sql"

echo "==> Database successfully bootstrapped at ${DB_PATH}!"
