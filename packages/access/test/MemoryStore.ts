/* eslint-disable @typescript-eslint/no-unused-vars, no-new */

import test from 'ava';

import { Access, Role, MemoryStore } from '../src';

import { Roles } from './fixtures';

let store: MemoryStore;
let acl: Access<any>;

test.before(() => {
  store = new MemoryStore(Roles as Role[]);
  acl = new Access({ store });
});

test('Should return error when passing invalid roles array', async (t) => {
  try {
    new MemoryStore(void 0 as any);
    new Access({ store });
  } catch (error) {
    t.snapshot(error);
  }
});

test('Should create a new MemoryStore instance', async (t) => {
  t.true(store instanceof MemoryStore);
});

test('Should create a new DotAccess instance', async (t) => {
  t.true(acl instanceof Access);
});

test('Should return empty array because role(s) does not exists', async (t) => {
  const result = store.getRolesByName(['none']);
  // expect(result).to.be.an('array').with.lengthOf(0);
  t.snapshot(result);
});

test('Should return validation error when calling "getRolesByName" with invalid roles', async (t) => {
  try {
    store.getRolesByName(void 0 as any);
  } catch (error) {
    // expect(e).to.be.instanceOf(Error).with.property('name').to.be.equal(ErrorEx.VALIDATION_ERROR);
    t.snapshot(error);
  }
});

test('Should return array of roles when calling "getRolesByName"', async (t) => {
  const result = store.getRolesByName(['administrator', 'operation']);
  // expect(result).to.be.an('array').with.lengthOf(2);
  t.snapshot(result);
});

test('Should return array of roles when accessing "roles"', async (t) => {
  const result = store.roles;
  // expect(result).to.be.an('array').with.lengthOf(3);
  t.snapshot(result);
});
