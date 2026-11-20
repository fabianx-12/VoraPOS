import DatabaseConstructor, { Database } from 'better-sqlite3';
import { databaseConfig } from '../../config/database.config.js';

export class SQLiteConnectionManager {
  private static instance: Database | null = null;

  public static getConnection(dbPath = 'vorapos.db'): Database {
    if (!this.instance) {
      const db = new DatabaseConstructor(dbPath);

      // Enforce Production Pragmas
      db.pragma(`journal_mode = ${databaseConfig.journalMode}`);
      db.pragma(`synchronous = ${databaseConfig.synchronous}`);
      db.pragma(`busy_timeout = ${databaseConfig.busyTimeoutMs}`);
      db.pragma(`foreign_keys = ${databaseConfig.foreignKeys ? 'ON' : 'OFF'}`);
      db.pragma(`temp_store = ${databaseConfig.tempStore}`);
      db.pragma(`cache_size = ${databaseConfig.cacheSize}`);

      this.instance = db;
    }
    return this.instance;
  }

  public static closeConnection(): void {
    if (this.instance && this.instance.open) {
      this.instance.close();
      this.instance = null;
    }
  }
}
