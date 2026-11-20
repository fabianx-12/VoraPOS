import { UUID } from '../../../shared/types/branded.types.js';

export interface User {
  readonly id: UUID;
  readonly roleId: UUID;
  readonly fullName: string;
  readonly pinHash: string | null;
  readonly passwordHash: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
