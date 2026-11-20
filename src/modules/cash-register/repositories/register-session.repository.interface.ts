import { Database } from 'better-sqlite3';
import { RegisterSession } from '../domain/register-session.entity.js';
import { UUID } from '../../../shared/types/branded.types.js';

export interface IRegisterSessionRepository {
  findById(id: UUID, tx?: Database): RegisterSession | null;
  findActiveSessionByRegisterId(registerId: UUID, tx?: Database): RegisterSession | null;
  save(session: RegisterSession, tx?: Database): void;
}
