/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, Access, MemoryStore } from '../../src';

import { Roles, ROLES, RESOURCES, USERS, ORDERS } from '../fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

let permission: Permission;

test.before(async () => {
  permission = await acl.can({ role: ROLES.SUPPORT, action: 'export', resource: RESOURCES.ORDER });
});

test('true if user can read provided resource', async (t) => {
  const ability = acl.canAccessResource(permission, USERS[0], ORDERS[1]);

  t.is(ability, true);
});
