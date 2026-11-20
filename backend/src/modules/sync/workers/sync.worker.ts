import { ISyncOutboxRepository } from '../repositories/sync-outbox.repository.interface.js';
import { ISyncHttpClient } from '../../../infrastructure/http/sync-http-client.js';
import { getCurrentIsoTimestamp } from '../../../shared/utils/date.utils.js';

export class SyncWorker {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly outboxRepo: ISyncOutboxRepository,
    private readonly httpClient: ISyncHttpClient,
    private readonly intervalMs = 15000,
    private readonly batchSize = 50
  ) {}

  public start(): void {
    if (this.timer) return;
    console.info(`[SYNC WORKER] Started background sync worker (Interval: ${this.intervalMs}ms)`);
    this.timer = setInterval(() => {
      void this.processBatch();
    }, this.intervalMs);

    // Initial immediate tick
    void this.processBatch();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.info('[SYNC WORKER] Stopped background sync worker');
    }
  }

  public async processBatch(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const pendingEvents = this.outboxRepo.fetchPendingBatch(this.batchSize);
      if (pendingEvents.length === 0) {
        return 0;
      }

      console.info(`[SYNC WORKER] Dispatching ${pendingEvents.length} outbox event(s) to cloud server...`);

      try {
        const { syncedIds } = await this.httpClient.pushBatch(pendingEvents);
        const now = getCurrentIsoTimestamp();
        this.outboxRepo.markSynced(syncedIds, now);
        console.info(`[SYNC WORKER] Successfully synced ${syncedIds.length} event(s)`);
        return syncedIds.length;
      } catch (networkError) {
        const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
        console.warn('[SYNC WORKER] Network batch push failed. Marking retry counters:', errorMessage);

        for (const event of pendingEvents) {
          if (event.id) {
            this.outboxRepo.markFailed(event.id, errorMessage);
          }
        }
        return 0;
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
