import { Database } from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export class MigrationRunner {
  constructor(private readonly db: Database) {}

  public runMigrations(migrationsDir = 'database/migrations'): void {
    // 1. Ensure migration tracking table exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      );
    `);

    if (!existsSync(migrationsDir)) {
      console.warn(`Migrations directory "${migrationsDir}" not found. Skipping migrations.`);
      return;
    }

    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const getAppliedStmt = this.db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
    const insertAppliedStmt = this.db.prepare('INSERT INTO schema_migrations (version) VALUES (?)');

    for (const file of migrationFiles) {
      const isApplied = getAppliedStmt.get(file);
      if (!isApplied) {
        const fullPath = join(migrationsDir, file);
        const sql = readFileSync(fullPath, 'utf-8');

        console.info(`Applying migration: ${file}`);
        this.db.transaction(() => {
          this.db.exec(sql);
          insertAppliedStmt.run(file);
        })();
        console.info(`Migration applied successfully: ${file}`);
      }
    }
  }
}
