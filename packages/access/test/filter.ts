/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES, PRODUCTS } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

let permission: Permission;

test.before(async () => {
  permission = await acl.can([ROLES.SUPPORT], 'read', RESOURCES.PRODUCT);
});

test('filter', async (t) => {
  const resource = acl.filter(permission, PRODUCTS[0]);

  // expect(resource).to.be.an('object').to.have.ownProperty('authorId');
  // expect(resource).to.be.an('object').to.not.have.ownProperty('isActive');
  t.snapshot(resource);
});
