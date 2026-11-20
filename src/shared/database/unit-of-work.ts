import { Database } from 'better-sqlite3';

export interface IUnitOfWork {
  execute<T>(operation: (db: Database) => T): T;
}

/**
 * SQLite Unit of Work implementing ACID atomic execution with BEGIN IMMEDIATE.
 * Prevents mid-transaction SQLITE_BUSY by reserving the write lock up front.
 */
export class SQLiteUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: Database) {}

  public execute<T>(operation: (db: Database) => T): T {
    // In better-sqlite3, transaction(fn).immediate() triggers BEGIN IMMEDIATE ... COMMIT/ROLLBACK
    const immediateTransaction = this.db.transaction((txDb: Database) => {
      return operation(txDb);
    });

    return immediateTransaction.immediate(this.db);
  }
}
