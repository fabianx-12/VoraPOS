# VoraPOS - Cloud Synchronization Protocol

## 1. Transactional Outbox Pattern

To eliminate the "dual-write" failure problem (where a sale is recorded locally but fails to transmit over the network), VoraPOS utilizes the **Transactional Outbox Pattern**.

### Outbox Flow:
1. **Single Local Transaction:** The sale record, line items, inventory deduction, and an entry in `sync_outbox` are committed atomically within one `BEGIN IMMEDIATE ... COMMIT` block.
2. **Background Polling Worker:** A lightweight asynchronous worker queries:
   ```sql
   SELECT id, entity_name, entity_id, operation, payload_json
   FROM sync_outbox
   WHERE status = 'PENDING'
   ORDER BY id ASC
   LIMIT 50;
   ```
3. **Idempotent Central Ingestion:** The worker POSTs the batch to PostgreSQL:
   ```sql
   INSERT INTO sales (id, receipt_number, total, ...)
   VALUES ($1, $2, $3, ...)
   ON CONFLICT (id) DO NOTHING;
   ```
4. **Acknowledgement:** Upon receiving HTTP `200 OK`, the terminal marks rows:
   ```sql
   UPDATE sync_outbox
   SET status = 'SYNCED', synced_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
   WHERE id IN (?);
   ```

---

## 2. Inbound Cloud-to-Terminal Replication

To pull catalog updates, price modifications, and new products from PostgreSQL:
1. **High-Water Mark Tracking:** `sync_checkpoints` stores the last cursor or timestamp per entity:
   ```sql
   SELECT last_synced_at, server_cursor 
   FROM sync_checkpoints 
   WHERE entity_name = 'products';
   ```
2. **Delta Fetch:** The terminal requests only records changed since `server_cursor`.
3. **Local Upsert:** Updates are merged using SQLite `INSERT ... ON CONFLICT(id) DO UPDATE`.
