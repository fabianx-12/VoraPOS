import { Database } from 'better-sqlite3';
import { ISyncOutboxRepository } from './sync-outbox.repository.interface.js';
import { SyncOutboxEntry, SyncOperation, SyncStatus } from '../domain/sync-outbox.entity.js';

export class SQLiteSyncOutboxRepository implements ISyncOutboxRepository {
  constructor(private readonly db: Database) {}

  public enqueue(entry: Omit<SyncOutboxEntry, 'id'>, tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO sync_outbox (
        entity_name, entity_id, operation, payload_json, status, retry_count, last_error, created_at
      ) VALUES (
        @entityName, @entityId, @operation, @payloadJson, @status, @retryCount, @lastError, @createdAt
      )
    `);

    stmt.run({
      entityName: entry.entityName,
      entityId: entry.entityId,
      operation: entry.operation,
      payloadJson: entry.payloadJson,
      status: entry.status,
      retryCount: entry.retryCount,
      lastError: entry.lastError,
      createdAt: entry.createdAt,
    });
  }

  public fetchPendingBatch(limit: number, tx?: Database): readonly SyncOutboxEntry[] {
    const conn = tx ?? this.db;
    const rows = conn
      .prepare(`
        SELECT * FROM sync_outbox
        WHERE status = 'PENDING'
        ORDER BY id ASC
        LIMIT ?
      `)
      .all(limit) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: r['id'] as number,
      entityName: r['entity_name'] as string,
      entityId: r['entity_id'] as string,
      operation: r['operation'] as SyncOperation,
      payloadJson: r['payload_json'] as string,
      status: r['status'] as SyncStatus,
      retryCount: r['retry_count'] as number,
      lastError: (r['last_error'] as string) || null,
      createdAt: r['created_at'] as string,
      syncedAt: (r['synced_at'] as string) || null,
    }));
  }

  public markSynced(ids: readonly number[], syncedAt: string, tx?: Database): void {
    if (ids.length === 0) return;
    const conn = tx ?? this.db;
    const placeholders = ids.map(() => '?').join(',');
    conn
      .prepare(`
        UPDATE sync_outbox
        SET status = 'SYNCED', synced_at = ?
        WHERE id IN (${placeholders})
      `)
      .run(syncedAt, ...ids);
  }

  public markFailed(id: number, errorMessage: string, tx?: Database): void {
    const conn = tx ?? this.db;
    conn
      .prepare(`
        UPDATE sync_outbox
        SET status = 'FAILED',
            retry_count = retry_count + 1,
            last_error = ?
        WHERE id = ?
      `)
      .run(errorMessage, id);
  }
}
