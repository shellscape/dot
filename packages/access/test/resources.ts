/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES, PRODUCTS, USERS } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

let permission: Permission;

test.before(async () => {
  permission = await acl.can([ROLES.ADMINISTRATOR, ROLES.SUPPORT], 'read', RESOURCES.PRODUCT);
});

test('can read resource', async (t) => {
  const ability = permission.canSubjectAccessResource(USERS[0], PRODUCTS[0]);

  t.is(ability, true);
});

test('cannot read resource', async (t) => {
  const resource = permission.filter(PRODUCTS[0]);

  // expect(resource).to.be.an('object').to.have.ownProperty('authorId');
  // expect(resource).to.be.an('object').to.not.have.ownProperty('isActive');
  t.snapshot(resource);
});
