import { UUID } from '../../../shared/types/branded.types.js';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'VOID';
export type SyncStatus = 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';

export interface SyncOutboxEntry {
  readonly id?: number;
  readonly entityName: string;
  readonly entityId: UUID | string;
  readonly operation: SyncOperation;
  readonly payloadJson: string;
  readonly status: SyncStatus;
  readonly retryCount: number;
  readonly lastError: string | null;
  readonly createdAt: string;
  readonly syncedAt: string | null;
}
