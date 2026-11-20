import { Database } from 'better-sqlite3';
import { IRegisterSessionRepository } from './register-session.repository.interface.js';
import { RegisterSession } from '../domain/register-session.entity.js';
import { UUID, toUUID, toCents } from '../../../shared/types/branded.types.js';

export class SQLiteRegisterSessionRepository implements IRegisterSessionRepository {
  constructor(private readonly db: Database) {}

  public findById(id: UUID, tx?: Database): RegisterSession | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare('SELECT * FROM register_sessions WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    return row ? this.mapRow(row) : null;
  }

  public findActiveSessionByRegisterId(registerId: UUID, tx?: Database): RegisterSession | null {
    const conn = tx ?? this.db;
    const row = conn
      .prepare("SELECT * FROM register_sessions WHERE register_id = ? AND status = 'OPEN'")
      .get(registerId) as Record<string, unknown> | undefined;

    return row ? this.mapRow(row) : null;
  }

  public save(session: RegisterSession, tx?: Database): void {
    const conn = tx ?? this.db;
    conn.prepare(`
      INSERT INTO register_sessions (
        id, register_id, opened_by_user_id, closed_by_user_id,
        opening_amount, expected_cash_amount, declared_cash_amount, cash_difference,
        status, opened_at, closed_at
      ) VALUES (
        @id, @registerId, @openedByUserId, @closedByUserId,
        @openingAmount, @expectedCashAmount, @declaredCashAmount, @cashDifference,
        @status, @openedAt, @closedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        closed_by_user_id = excluded.closed_by_user_id,
        expected_cash_amount = excluded.expected_cash_amount,
        declared_cash_amount = excluded.declared_cash_amount,
        cash_difference = excluded.cash_difference,
        status = excluded.status,
        closed_at = excluded.closed_at
    `).run({
      id: session.id,
      registerId: session.registerId,
      openedByUserId: session.openedByUserId,
      closedByUserId: session.closedByUserId,
      openingAmount: session.openingAmount,
      expectedCashAmount: session.expectedCashAmount,
      declaredCashAmount: session.declaredCashAmount,
      cashDifference: session.cashDifference,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
    });
  }

  private mapRow(row: Record<string, unknown>): RegisterSession {
    return {
      id: toUUID(row['id'] as string),
      registerId: toUUID(row['register_id'] as string),
      openedByUserId: toUUID(row['opened_by_user_id'] as string),
      closedByUserId: row['closed_by_user_id'] ? toUUID(row['closed_by_user_id'] as string) : null,
      openingAmount: toCents(row['opening_amount'] as number),
      expectedCashAmount: row['expected_cash_amount'] !== null ? toCents(row['expected_cash_amount'] as number) : null,
      declaredCashAmount: row['declared_cash_amount'] !== null ? toCents(row['declared_cash_amount'] as number) : null,
      cashDifference: row['cash_difference'] !== null ? toCents(row['cash_difference'] as number) : null,
      status: row['status'] as 'OPEN' | 'CLOSED',
      openedAt: row['opened_at'] as string,
      closedAt: (row['closed_at'] as string) || null,
    };
  }
}
