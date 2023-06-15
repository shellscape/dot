/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, Access, MemoryStore } from '../src';

import { Roles, ROLES, RESOURCES, PRODUCTS, USERS } from './fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

let permission: Permission;

test.before(async () => {
  permission = await acl.can({
    role: [ROLES.ADMINISTRATOR, ROLES.SUPPORT],
    action: 'read',
    resource: RESOURCES.PRODUCT
  });
});

test('can read resource', async (t) => {
  const granted = permission.canAccess(USERS[0], PRODUCTS[0]);

  t.is(granted, true);

  const resource = permission.filter(PRODUCTS[0]);

  t.snapshot(resource);
});
