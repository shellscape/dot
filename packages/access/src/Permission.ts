import { canAccessResource, filter } from './helpers';

import { Dict } from './types';
import type { Action, Conditions, Resource, Role } from './structs';
import { Attributes } from './structs';

export interface PermissionOptions {
  action: Action | null;
  attributes?: Attributes;
  conditions?: Conditions;
  granted: boolean;
  grants?: Map<string, Resource>;
  resource: Resource | null;
  roles: Role[];
  scope?: Dict;
}

const defaults = {
  attributes: [],
  conditions: [],
  grants: {},
  scope: {}
};

export class Permission {
  private readonly options: PermissionOptions;

  constructor(options: PermissionOptions) {
    this.options = Object.assign({}, defaults, options);
  }

  get action() {
    return this.options.action;
  }

  get attributes() {
    return this.options.attributes;
  }

  get conditions() {
    return this.options.conditions;
  }

  get granted() {
    return this.options.granted;
  }

  get grants() {
    return this.options.grants;
  }

  get resource() {
    return this.options.resource;
  }

  get roles() {
    return this.options.roles;
  }

  get scope() {
    return this.options.scope;
  }

  /**
   * check if permission allows subject (user) to access object (resource),
   * role conditions will be evaluated for this check
   * @param {Dict} subject User object
   * @param {Dict} object Resource object
   * @returns {Promise<boolean>}
   */
  canAccess(subject: Dict, resource: Dict): boolean {
    return canAccessResource(this, subject, resource);
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
