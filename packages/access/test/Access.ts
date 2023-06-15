/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Access, MemoryStore } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const store = new MemoryStore(Roles as any[]);
const acl = new Access({ store });

test('validation error, for invalid adapter', async (t) => {
  try {
    new Access(void 0 as any);
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error, for invalid roles schema', async (t) => {
  const error = await t.throws(() => {
    new Access({
      store: new MemoryStore([
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
    });
  });
  t.snapshot(error);
});

test('validation error, for missing role', async (t) => {
  const ROLE_NAME = 'finance';
  try {
    await acl.can({ role: ROLE_NAME, action: 'create', resource: 'product' });
  } catch (error) {
    t.snapshot(error);
  }
});

test('validation error object, if role is invalid', async (t) => {
  try {
    await acl.can({ role: void 0 as any, action: 'read', resource: 'product' });
  } catch (error) {
    t.snapshot(error);
  }
});

test('ignore falsy role names', async (t) => {
  await acl.can({
    role: [ROLES.ADMINISTRATOR, void 0 as any],
    action: 'read',
    resource: 'product'
  });
  t.pass();
});

test('validation error object, if one or more roles are missing', async (t) => {
  try {
    await acl.can({ role: [ROLES.ADMINISTRATOR, 'auditor'], action: 'read', resource: 'product' });
  } catch (error) {
    t.snapshot(error);
  }
});

test('permission with granted equal false when resource does not exist', async (t) => {
  const permission = await acl.can({
    role: [ROLES.OPERATION],
    action: 'delete',
    resource: 'languages'
  });

  const { granted } = permission;
  t.is(granted, false);
});

test('permission with granted equal false when action is not allowed', async (t) => {
  const permission = await acl.can({
    role: [ROLES.OPERATION],
    action: 'delete',
    resource: RESOURCES.FILE
  });
  const { granted } = permission;
  t.is(granted, false);
});

test('permission with granted equal true when action is allowed on resource', async (t) => {
  const permission = await acl.can({
    role: [ROLES.OPERATION],
    action: 'read',
    resource: RESOURCES.ORDER
  });

  const { granted } = permission;
  t.is(granted, true);
});

test('permission with granted equal true when subject has access to all actions on resource', async (t) => {
  const permission = await acl.can({
    role: [ROLES.ADMINISTRATOR],
    action: 'readAll',
    resource: RESOURCES.FILE
  });
  const { granted } = permission;
  t.is(granted, true);
});
