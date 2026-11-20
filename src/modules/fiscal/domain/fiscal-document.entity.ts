import { UUID } from '../../../shared/types/branded.types.js';

export type FiscalDocumentType = 'POS_TICKET' | 'ELECTRONIC_INVOICE' | 'EQUIVALENT_DOC';
export type FiscalSubmissionStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export interface FiscalDocument {
  readonly id: UUID;
  readonly saleId: UUID;
  readonly documentType: FiscalDocumentType;
  readonly submissionStatus: FiscalSubmissionStatus;
  readonly fiscalUuidOrCufe: string | null;
  readonly lastError: string | null;
  readonly retryCount: number;
  readonly updatedAt: string;
}
