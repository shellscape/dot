/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

test('validation error, for invalid adapter', async (t) => {
  try {
    new DotAccess(void 0 as any);
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error, for invalid roles schema', async (t) => {
  const access = new DotAccess(
    new MemoryAdapter([
      {
        name: 'support',
        resources: [
          {
            actions: [
              {
                attributes: ['*']
              }
            ]
          }
        ]
      } as any
    ])
  );

  const error = await t.throwsAsync(() => access.can([ROLES.SUPPORT], 'ready', RESOURCES.PRODUCT));
  t.snapshot(error);
});

test('validation error, for missing role', async (t) => {
  const ROLE_NAME = 'finance';
  try {
    await acl.can(ROLE_NAME, 'create', 'product');
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error object, if role is invalid', async (t) => {
  try {
    await acl.can(void 0 as any, 'read', 'product');
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error object, if one or more roles are invalid', async (t) => {
  try {
    await acl.can([ROLES.ADMINISTRATOR, void 0 as any], 'read', 'product');
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error object, if one or more roles are missing', async (t) => {
  try {
    await acl.can([ROLES.ADMINISTRATOR, 'auditor'], 'read', 'product');
  } catch (error) {
    t.snapshot(error);
  }
});

test('permission with granted equal false when resource does not exist', async (t) => {
  const permission = await acl.can([ROLES.OPERATION], 'delete', 'languages');
  const { granted } = permission;
  t.is(granted, false);
});

test('permission with granted equal false when action is not allowed', async (t) => {
  const permission = await acl.can([ROLES.OPERATION], 'delete', RESOURCES.FILE);
  const { granted } = permission;
  t.is(granted, false);
});

test('permission with granted equal true when action is allowed on resource', async (t) => {
  const permission = await acl.can([ROLES.OPERATION], 'read', RESOURCES.ORDER);
  const { granted } = permission;
  t.is(granted, true);
});

test('permission with granted equal true when subject has access to all actions on resource', async (t) => {
  const permission = await acl.can([ROLES.ADMINISTRATOR], 'readAll', RESOURCES.FILE);
  const { granted } = permission;
  t.is(granted, true);
});
