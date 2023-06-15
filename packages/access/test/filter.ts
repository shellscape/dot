/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, Access, MemoryStore } from '../src';

import { Roles, ROLES, RESOURCES, PRODUCTS } from './fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

let permission: Permission;

test.before(async () => {
  permission = await acl.can({
    role: [ROLES.SUPPORT],
    action: 'read',
    resource: RESOURCES.PRODUCT
  });
});

test('filter', async (t) => {
  const resource = acl.filter(permission, PRODUCTS[0]);

  // expect(resource).to.be.an('object').to.have.ownProperty('authorId');
  // expect(resource).to.be.an('object').to.not.have.ownProperty('isActive');
  t.snapshot(resource);
});
