/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Access, MemoryStore } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

test('can', async (t) => {
  const actionName = 'update';
  const resourceName = RESOURCES.ORDER;
  const roleName = ROLES.SUPPORT;
  const result = await acl.can({ role: roleName, action: actionName, resource: resourceName });

  t.snapshot(result);

  const { action, resource, granted } = result;

  t.is(action?.name, actionName);
  t.is(resource?.name, resourceName);
  t.is(granted, true);
});
