import { Role } from '../types';

export interface IRoleStore {
  getRolesByName: (names: string[]) => Promise<Role[]> | Role[];
  roles: Role[];
}
