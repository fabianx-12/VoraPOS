import { SyncOutboxEntry } from '../../modules/sync/domain/sync-outbox.entity.js';

export interface ISyncHttpClient {
  pushBatch(events: readonly SyncOutboxEntry[]): Promise<{ syncedIds: readonly number[] }>;
}

export class SyncHttpClient implements ISyncHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly maxRetries = 3
  ) {}

  public async pushBatch(events: readonly SyncOutboxEntry[]): Promise<{ syncedIds: readonly number[] }> {
    if (events.length === 0) return { syncedIds: [] };

    let attempt = 0;
    let delayMs = 500;

    while (attempt < this.maxRetries) {
      try {
        const response = await fetch(`${this.baseUrl}/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Idempotency-Key': `batch-${events[0]?.id}-${Date.now()}`,
          },
          body: JSON.stringify({ events }),
        });

        if (!response.ok) {
          throw new Error(`Sync server responded with HTTP status ${response.status}: ${await response.text()}`);
        }

        const data = (await response.json()) as { acknowledgedIds?: number[] };
        const syncedIds = data.acknowledgedIds ?? events.map((e) => e.id!).filter(Boolean);
        return { syncedIds };
      } catch (error) {
        attempt++;
        if (attempt >= this.maxRetries) {
          throw error;
        }
        // Exponential backoff with jitter
        const jitter = Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
        delayMs *= 2;
      }
    }

    throw new Error('Sync HTTP push failed after maximum retries');
  }
}
