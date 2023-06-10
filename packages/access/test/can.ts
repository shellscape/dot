/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Permission, DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);
let permission: Permission;

test.before(async () => {});

test('can', async (t) => {
  const actionName = 'update';
  const resourceName = RESOURCES.ORDER;
  const roleName = ROLES.SUPPORT;
  const result = await acl.can(roleName, actionName, resourceName);

  // expect(attributes).to.be.an('array').to.be.eql(['status', 'items']);
  // expect(conditions).to.be.an('array').with.length(0);
  // expect(scope).to.be.an('object').and.to.be.eql({});
  // expect(grants).to.be.an('object').with.keys([RESOURCES.USER, RESOURCES.ORDER, RESOURCES.PRODUCT]);
  // expect(roles).to.be.an('array').to.be.eql([roleName]);
  t.snapshot(result);

  const { access, granted } = permission;
  const { action, resource } = access;

  t.is(action, actionName);
  t.is(resource, resourceName);
  t.is(granted, true);
});
