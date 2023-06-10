/* eslint-disable @typescript-eslint/no-unused-vars, no-new */

import test from 'ava';

import { DotAccess, Role, MemoryAdapter } from '../src';

import { Roles } from './fixtures';

let adapter: MemoryAdapter;
let acl: DotAccess;

test.before(() => {
  adapter = new MemoryAdapter(Roles as Role[]);
  acl = new DotAccess(adapter);
});

test('Should return error when passing invalid roles array', async (t) => {
  try {
    new MemoryAdapter(void 0 as any);
    new DotAccess(adapter);
  } catch (error) {
    t.snapshot(error);
  }
});

test('Should create a new MemoryAdapter instance', async (t) => {
  t.true(adapter instanceof MemoryAdapter);
});

test('Should create a new DotAccess instance', async (t) => {
  t.true(acl instanceof DotAccess);
});

test('Should return empty array because role(s) does not exists', async (t) => {
  const result = adapter.getRolesByName(['none']);
  // expect(result).to.be.an('array').with.lengthOf(0);
  t.snapshot(result);
});

test('Should return validation error when calling "getRolesByName" with invalid roles', async (t) => {
  try {
    adapter.getRolesByName(void 0 as any);
  } catch (error) {
    // expect(e).to.be.instanceOf(Error).with.property('name').to.be.equal(ErrorEx.VALIDATION_ERROR);
    t.snapshot(error);
  }
});

test('Should return array of roles when calling "getRolesByName"', async (t) => {
  const result = adapter.getRolesByName(['administrator', 'operation']);
  // expect(result).to.be.an('array').with.lengthOf(2);
  t.snapshot(result);
});

test('Should return array of roles when calling "getRoles"', async (t) => {
  const result = adapter.getRoles();
  // expect(result).to.be.an('array').with.lengthOf(3);
  t.snapshot(result);
});
