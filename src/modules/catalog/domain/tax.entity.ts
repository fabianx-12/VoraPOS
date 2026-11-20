import { UUID, BasisPoints } from '../../../shared/types/branded.types.js';

export interface Tax {
  readonly id: UUID;
  readonly name: string;
  readonly rateBps: BasisPoints;
  readonly isActive: boolean;
  readonly createdAt: string;
}
