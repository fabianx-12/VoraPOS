import { ErrorCode } from './error-codes.enum.js';

export abstract class DomainError extends Error {
  public abstract readonly code: ErrorCode;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientStockError extends DomainError {
  public override readonly code = ErrorCode.INSUFFICIENT_STOCK;

  constructor(
    public readonly productId: string,
    public readonly requestedQty: number,
    public readonly availableQty: number
  ) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQty}, Available: ${availableQty}`,
      { productId, requestedQty, availableQty }
    );
  }
}

export class RegisterClosedError extends DomainError {
  public override readonly code = ErrorCode.REGISTER_CLOSED;

  constructor(public readonly registerSessionId: string) {
    super(`Register shift ${registerSessionId} is CLOSED or inactive. Cannot process sales.`, {
      registerSessionId,
    });
  }
}

export class InvalidPaymentTotalError extends DomainError {
  public override readonly code = ErrorCode.INVALID_PAYMENT_TOTAL;

  constructor(
    public readonly totalExpected: number,
    public readonly totalPaid: number
  ) {
    super(
      `Total payments received (${totalPaid} cents) does not match the required sale total (${totalExpected} cents).`,
      { totalExpected, totalPaid }
    );
  }
}

export class SaleAlreadyVoidedError extends DomainError {
  public override readonly code = ErrorCode.SALE_ALREADY_VOIDED;

  constructor(public readonly saleId: string) {
    super(`Sale ${saleId} has already been VOIDED.`, { saleId });
  }
}

export class EntityNotFoundError extends DomainError {
  public override readonly code = ErrorCode.ENTITY_NOT_FOUND;

  constructor(
    public readonly entityName: string,
    public readonly id: string
  ) {
    super(`${entityName} with identifier "${id}" was not found.`, { entityName, id });
  }
}

export class ValidationError extends DomainError {
  public override readonly code = ErrorCode.VALIDATION_FAILED;

  constructor(
    message: string,
    public readonly issues: readonly unknown[]
  ) {
    super(message, { issues });
  }
}
