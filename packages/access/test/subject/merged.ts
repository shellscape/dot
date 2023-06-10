/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, DotAccess, MemoryAdapter } from '../../src';

import { Roles, ROLES, RESOURCES, PRODUCTS, USERS } from '../fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

let permission: Permission;

test.before(async () => {
  permission = await acl.can([ROLES.OPERATION, ROLES.SUPPORT], 'read', RESOURCES.PRODUCT);
});

test('Should return true if user can read provided resource according to role conditions', async (t) => {
  const ability = acl.canSubjectAccessResource(permission, USERS[0], PRODUCTS[0]);

  t.is(ability, true);
});

test('Should return false if user can not read provided resource according to role conditions', async (t) => {
  const ability = acl.canSubjectAccessResource(permission, USERS[1], PRODUCTS[0]);

  t.is(ability, false);
});
