import { Database } from 'better-sqlite3';
import { SyncOutboxEntry } from '../domain/sync-outbox.entity.js';

export interface ISyncOutboxRepository {
  enqueue(entry: Omit<SyncOutboxEntry, 'id'>, tx: Database): void;
  fetchPendingBatch(limit: number, tx?: Database): readonly SyncOutboxEntry[];
  markSynced(ids: readonly number[], syncedAt: string, tx?: Database): void;
  markFailed(id: number, errorMessage: string, tx?: Database): void;
}
