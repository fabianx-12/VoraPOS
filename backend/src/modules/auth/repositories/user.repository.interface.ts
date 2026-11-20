import { User } from '../domain/user.entity.js';
import { UUID } from '../../../shared/types/branded.types.js';

export interface IUserRepository {
  findById(id: UUID): Promise<User | null>;
  findByPinHash(pinHash: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
