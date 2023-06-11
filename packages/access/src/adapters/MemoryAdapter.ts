import { Role } from '../types';

import { BaseAdapter } from './BaseAdapter';

export class MemoryAdapter extends BaseAdapter {
  private _roles: Array<Role> = [];
  private _cache: { [k: string]: Role } = {};

  constructor(roles: Array<Role>) {
    super('MemoryAdapter');
    this.setRoles(roles);
  }

  setRoles(roles: Array<Role>): void {
    if (roles == null || !Array.isArray(roles) || roles.length === 0) {
      throw new RangeError(`Missing/Invalid roles array in "${this.constructor.name}"`);
    }

    this._roles = roles;
    this._cache = {};
    // Cache roles by name
    this._roles.forEach((role: Role) => {
      // this.validateGrant(grant, true);
      this._cache[role.name] = role;
    });
  }

  getRoles(): Array<Role> {
    return this._roles;
  }

  getRolesByName(names: Array<string>): Array<Role> {
    const result = [];

    if (names == null) {
      throw new RangeError(`names array can not be null or undefined`);
    }

    for (let i = 0; i < names.length; i += 1) {
      if (this._cache[names[i]] != null) {
        result.push(this._cache[names[i]]);
      }
    }

    return result;
  }
}
