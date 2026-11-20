import { UUID } from '../../../shared/types/branded.types.js';

export type RoleName = 'ADMIN' | 'CASHIER' | 'SUPERVISOR';

export interface Role {
  readonly id: UUID;
  readonly name: RoleName;
  readonly permissionsJson: string;
  readonly createdAt: string;
}
