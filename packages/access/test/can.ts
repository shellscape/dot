/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

test('can', async (t) => {
  const actionName = 'update';
  const resourceName = RESOURCES.ORDER;
  const roleName = ROLES.SUPPORT;
  const result = await acl.can(roleName, actionName, resourceName);

  t.snapshot(result);

  const { access, granted } = result;
  const { action, resource } = access;

  t.is(action, actionName);
  t.is(resource, resourceName);
  t.is(granted, true);
});
