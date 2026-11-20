import { Database } from 'better-sqlite3';
import { FiscalDocument } from '../domain/fiscal-document.entity.js';

export interface IFiscalQueueAdapter {
  enqueue(document: FiscalDocument, tx: Database): void;
}

export class SQLiteFiscalQueueAdapter implements IFiscalQueueAdapter {
  public enqueue(document: FiscalDocument, tx: Database): void {
    const stmt = tx.prepare(`
      INSERT INTO fiscal_documents (
        id, sale_id, document_type, submission_status, fiscal_uuid_or_cufe, last_error, retry_count, updated_at
      ) VALUES (
        @id, @saleId, @documentType, @submissionStatus, @fiscalUuidOrCufe, @lastError, @retryCount, @updatedAt
      )
    `);

    stmt.run({
      id: document.id,
      saleId: document.saleId,
      documentType: document.documentType,
      submissionStatus: document.submissionStatus,
      fiscalUuidOrCufe: document.fiscalUuidOrCufe,
      lastError: document.lastError,
      retryCount: document.retryCount,
      updatedAt: document.updatedAt,
    });
  }
}
