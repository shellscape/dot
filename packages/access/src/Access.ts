/* eslint-disable class-methods-use-this */
import { getLog } from '@dot/log';
import chalk from 'chalk';
import cloneDeep from 'lodash.clonedeep';

import {
  canAccessResource,
  difference,
  filter,
  mergeAttributes,
  mergeConditions,
  mergeScope
} from './helpers';
import { Permission, PermissionOptions } from './Permission';
import { ALL, Dict, Role as ExternalRole } from './types';
import { IRoleStore, MemoryStore } from './stores';
import type { Action, Condition, Resource, Role } from './structs';
import { checkRole, checkSchema } from './structs';

export interface AccessOptions<TStore> {
  roles?: ExternalRole[];
  store?: TStore;
}

export interface CanOptions {
  /** Action name (Like "create") */
  action: string;
  /** Resource name (Like "order") */
  resource: string;
  /** One or more role names */
  role: string | string[];
}

const log = getLog({ brand: '@dot', name: '\u001b[1D/access' });

export class Access<TStore extends IRoleStore> {
  public readonly store: TStore;

  constructor({ roles, store }: AccessOptions<TStore>) {
    if (store) {
      this.store = store;
    } else {
      if (!roles) throw new RangeError('If `store` is not specified, `roles` is required');
      this.store = new MemoryStore(roles) as any;
    }

    checkSchema(this.store.roles);

    Object.freeze(this.store);
  }

  /**
   * Check the ability of accessing a resource through one or more roles (assigned to subject)
   * and the ability of executing specific action on this resource
   * @param {CanOptions} options for checking access to a resouce
   * @returns {Promise<Permission>}
   */
  async can(options: CanOptions): Promise<Permission> {
    const { action: actionName, resource: resourceName, role: roleName } = options;
    const roleNames = ([] as string[]).concat(roleName).filter(Boolean);

    // Get roles by their names
    const roles = (await this.store.getRolesByName(roleNames)) as unknown as Role[];
    // Validate that all roles are available in roles list
    if (roles == null) {
      throw new RangeError(`The roles store contains no roles for the role names provided`);
    }

    if (roles.length !== roleNames.length) {
      const diff = difference(
        roleNames,
        roles.map((r) => r.name)
      );
      throw new RangeError(`Role(s) [${diff.toString()}] does not exist`);
    }

    // Merge roles resource, actions, attributes, conditions and scope (if possible)
    const resources = this.getResources(roles);
    const resource = resources.get(resourceName);

    if (!resource)
      log.warn(
        chalk`The resouce {magenta ${resourceName}} does not exist in the provided Roles schema`
      );

    const permOptions: PermissionOptions = {
      action: null,
      granted: false,
      resource: resource || null,
      roles
    };
    permOptions.grants = resources;

    // Validate resource & ability, then update permission
    if (resource) {
      if (resource.actions[0] === ALL) {
        // If subject has access to all actions within the resource
        [permOptions.action] = resource.actions as any[];
        permOptions.attributes = [ALL];
        permOptions.scope = {};
        permOptions.granted = true;
      } else {
        const actions = resources.get(resourceName)?.actions;
        const action = (actions as Action[]).find(({ name }) => name === actionName);

        if (action) {
          // If subject has access specific actions within the resource
          const { attributes, conditions, scope } = action;
          permOptions.action = action;
          permOptions.attributes = attributes;
          permOptions.conditions = conditions;
          permOptions.scope = scope;
          permOptions.granted = true;
        } else {
          log.warn(
            chalk`The action {magenta ${actionName}} does not exist for the requested resource`
          );
        }
      }
    }

    return new Permission(permOptions);
  }

  /**
   * Check if permission allows subject (like user) to access resource,
   * role conditions will be evaluated for this check
   * @param permission Permission object
   * @param {Dict} subject User object
   * @param {Dict} resource Resource object
   * @returns {Promise<boolean>}
   */
  canAccessResource(permission: Permission, subject: Dict, resource: Dict): boolean {
    return canAccessResource(permission, subject, resource);
  }

  /**
   * Filter data based on fields within current permission
   * @param permission
   * @param {Dict} data
   * @returns {any}
   */
  filter(permission: Permission, data: Dict) {
    return filter(permission, data);
  }

  /**
   * Validate role object schema
   * @param {Role} role Role object
   * @returns {void}
   * @protected
   */
  protected validateRole(role: Role): void {
    checkRole(role);
  }

  /**
   * Build hash table from one or more roles, merging resources and actions
   * @param {Array<Role>} roles Roles array
   * @returns {{[p: string]: Dict}} Object with merged resources, including internal data like attributes, conditions
   * @private
   */
  private getResources(roles: Role[]): Map<string, Resource> {
    if (!roles?.length) throw new RangeError('`roles` must be an array with a non-zero length');

    const resources = roles.reduce((prev, role) => prev.concat(role.resources), [] as Resource[]);
    const resourceMap = resources.reduce((map, root) => {
      const clone = cloneDeep(root);

      if (map.has(root.name)) {
        const cached = map.get(root.name)!;

        if (cached.actions[0] === ALL || clone.actions[0] === ALL) {
          cached.actions = ['*'];
        } else {
          (cached.actions as Action[]).forEach((action, index) => {
            if (index >= clone.actions.length) return;

            const { attributes, conditions, scope } = (clone.actions as Action[])[index];
            cached.actions[index] = {
              ...action,
              attributes: mergeAttributes(action.attributes, attributes),
              conditions: mergeConditions(
                action.conditions as Condition[],
                conditions as Condition[]
              ),
              scope: mergeScope(action.scope!, scope!)
            };
          });
        }

        map.set(root.name, cached);
      } else {
        map.set(root.name, clone);
      }

      return map;
    }, new Map<string, Resource>());

    // roles.forEach((role) => {
    //   role.resources.forEach((resource) => {
    //     let cachedResource = result.get(resource.name);

    //     // Note: If resource does not exist, add to object
    //     if (!cachedResource) {
    //       result.set(resource.name, { ...resource });
    //       cachedResource = result.get(resource.name);
    //       // Note: If resource has wildcard action then skip merging actions
    //     } else if (cachedResource.actions[0] === ALL) return;

    //     if (
    //       resource.actions.length === 1 &&
    //       isString(resource.actions[0]) &&
    //       resource.actions[0] === ALL
    //     ) {
    //       result.set(resource.name, { ...resource, actions: [ALL] });
    //       return;
    //     }

    //     (resource.actions as Action[]).forEach((action) => {
    //       const currentAction: Action = {
    //         attributes: [...(action.attributes || ([] as any))],
    //         conditions: [...(action.conditions || ([] as any))],
    //         name: action.name,
    //         scope: action.scope ? Object.assign(action.scope) : {}
    //       };
    //       const actions = result.get(resource.name)?.actions;

    //       // If we have all actions allowed no need to proceed
    //       if (!actions?.length || actions?.[0] === ALL) return;

    //       const cachedAction = (actions as Action[])?.find(
    //         ({ name }) => name === currentAction.name
    //       );

    //       if (!cachedAction) {
    //         result.set(resource.name, {
    //           ...(result.get(resource.name) as any),
    //           ...{ actions: [currentAction] }
    //         });
    //       } else {
    //         // // Check and merge attributes
    //         // const currentIsAll =
    //         //   currentAction.attributes?.length === 1 && currentAction.attributes[0] === ALL;
    //         // const cachedIsAll =
    //         //   cachedAction.attributes?.length === 1 && cachedAction.attributes[0] === ALL;

    //         // if (!cachedIsAll) {
    //         //   if (currentIsAll) {
    //         //     // If action or cached actions = ['*'] then, no need to merge
    //         //     // We take the most permissive attributes
    //         //     cachedAction.attributes = [ALL];
    //         //   } else {
    //         //     cachedAction.attributes = merge(
    //         //       cachedAction.attributes || [],
    //         //       currentAction.attributes || []
    //         //     );
    //         //   }
    //         // }

    //         // if (!currentAction.conditions) currentAction.conditions = [];
    //         // if (!currentAction.scope) currentAction.scope = {};

    //         // const emptyConditions = !currentAction.conditions.length;
    //         // const emptyConditionCache = !cachedAction.conditions?.length;
    //         // const emptyScope = !Object.entries(currentAction.scope || {}).length;
    //         // const emptyScopeCache = !Object.entries(cachedAction.scope || {}).length;

    //         // if (emptyConditions && !emptyConditionCache) {
    //         //   cachedAction.conditions = [];
    //         // } else if (!emptyConditionCache) {
    //         //   (cachedAction.conditions as Condition[] | undefined)?.push(
    //         //     ...(currentAction.conditions as any)
    //         //   );
    //         // }

    //         // if (emptyScope && !emptyScopeCache) {
    //         //   cachedAction.scope = {};
    //         // } else if (!emptyScopeCache) {
    //         //   Object.entries(currentAction.scope).forEach(([k, v]) => {
    //         //     cachedAction.scope![k] = v;
    //         //   });
    //         // }
    //       }
    //     });
    //   });
    // });

    return resourceMap;
  }
}
