# ============================================================================
# VoraPOS - Database Bootstrap Script (PowerShell)
# Path: scripts/setup_database.ps1
# Usage: .\scripts\setup_database.ps1 [-DatabasePath .\vorapos.db] [-WithSeeds]
# ============================================================================

param (
    [string]$DatabasePath = "vorapos.db",
    [switch]$WithSeeds = $true
)

$ErrorActionPreference = "Stop"

Write-Host "==> Initializing VoraPOS SQLite Database at: $DatabasePath" -ForegroundColor Cyan

# Locate sqlite3 executable
$sqliteCmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
if (-not $sqliteCmd) {
    $commonPaths = @(
        "C:\Program Files\SQLite\sqlite3.exe",
        "C:\sqlite\sqlite3.exe",
        "$env:USERPROFILE\scoop\shims\sqlite3.exe"
    )
    foreach ($p in $commonPaths) {
        if (Test-Path $p) {
            $sqliteCmd = $p
            break
        }
    }
}

if (-not $sqliteCmd) {
    Write-Warning "sqlite3 executable not found on PATH. Please ensure SQLite CLI is installed."
    Write-Host "You can execute the migration scripts manually:"
    Write-Host "  database/migrations/v1.0.0_initial_schema.sql"
    Write-Host "  database/seeds/master_seed.sql"
    exit 1
}

Write-Host "--> Applying Migration: v1.0.0_initial_schema.sql" -ForegroundColor Green
Get-Content "database/sqlite/migrations/v1.0.0_initial_schema.sql" | & $sqliteCmd $DatabasePath

if ($WithSeeds) {
    Write-Host "--> Seeding Baseline Data: master_seed.sql" -ForegroundColor Green
    Get-Content "database/sqlite/seeds/master_seed.sql" | & $sqliteCmd $DatabasePath
}

Write-Host "==> Database successfully bootstrapped!" -ForegroundColor Cyan
