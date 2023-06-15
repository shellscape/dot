/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, Access, MemoryStore } from '../../src';

import { Roles, ROLES, RESOURCES, PRODUCTS, USERS } from '../fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

let permission: Permission;

test.before(async () => {
  permission = await acl.can({
    role: ROLES.OPERATION,
    action: 'read',
    resource: RESOURCES.PRODUCT
  });
});

test('false if resource is invalid', async (t) => {
  const ability = acl.canAccessResource(permission, USERS[0], {});

  t.is(ability, false);
});

test('false if subject is invalid', async (t) => {
  const ability = acl.canAccessResource(permission, {}, USERS[0]);

  t.is(ability, false);
});

test('true if user can read provided resource', async (t) => {
  const ability = acl.canAccessResource(permission, USERS[0], PRODUCTS[0]);

  t.is(ability, true);
});

test('false if user can not read provided resource', async (t) => {
  const ability = acl.canAccessResource(permission, USERS[1], PRODUCTS[0]);

  t.is(ability, false);
});
