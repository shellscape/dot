/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, DotAccess, MemoryAdapter } from '../../src';

import { Roles, ROLES, RESOURCES, USERS, ORDERS } from '../fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

let permission: Permission;

test.before(async () => {
  permission = await acl.can(ROLES.SUPPORT, 'export', RESOURCES.ORDER);
});

test('true if user can read provided resource', async (t) => {
  const ability = acl.canSubjectAccessResource(permission, USERS[0], ORDERS[1]);

  t.is(ability, true);
});
