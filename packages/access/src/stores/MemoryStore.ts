import { Role } from '../types';

import { IRoleStore } from './IRoleStore';

export class MemoryStore implements IRoleStore {
  public readonly roles: Role[] = [];

  constructor(roles: Role[]) {
    if (roles == null || !Array.isArray(roles) || roles.length === 0) {
      throw new RangeError(`Missing/Invalid roles array in "${this.constructor.name}"`);
    }

    this.roles = roles;
  }

  getRolesByName(names: string[]): Role[] {
    if (!names?.length) throw new RangeError('`names` must be an array with a non-zero length');

    return this.roles.filter(({ name }) => names.includes(name));
  }
}
