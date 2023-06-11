import { canSubjectAccessResource, filter } from './helpers';

import { Dict } from './types';
import { Access, IAccessInfo } from './Access';

export interface PermissionOptions {
  access: IAccessInfo;
  attributes?: Array<string>;
  conditions?: Array<Dict>;
  granted: boolean;
  grants?: Dict;
  scope?: Dict;
}

export class Permission {
  private readonly _granted: boolean;
  private readonly _access: Access;
  private readonly _grants: Dict;
  private readonly _attributes: Array<string>;
  private readonly _conditions: Array<Dict>;
  private readonly _scope: Dict;

  constructor(permission: PermissionOptions) {
    this._granted = permission.granted;
    this._access = new Access(permission.access);
    this._grants = permission.grants || {};
    this._attributes = permission.attributes || [];
    this._conditions = permission.conditions || [];
    this._scope = permission.scope || {};
  }

  get granted(): boolean {
    return this._granted;
  }

  get access(): Access {
    return this._access;
  }

  get grants(): Dict {
    return this._grants;
  }

  get attributes(): Array<string> {
    return this._attributes;
  }

  get conditions(): Array<Dict> {
    return this._conditions;
  }

  get scope(): Dict {
    return this._scope;
  }

  /**
   * check if permission allows subject (user) to access object (resource),
   * role conditions will be evaluated for this check
   * @param {Dict} subject User object
   * @param {Dict} object Resource object
   * @returns {Promise<boolean>}
   */
  canSubjectAccessResource(subject: Dict, object: Dict): boolean {
    return canSubjectAccessResource(this, subject, object);
  }

  /**
   * Filter data based on attributes within current permission
   * @param {Dict} data
   * @returns {any}
   */
  filter(data: Dict) {
    return filter(this, data);
  }
}
