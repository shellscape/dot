/* eslint-disable no-new, sort-keys */

import test from 'ava';

import { Action, Role, DotAccess, MemoryAdapter } from '../src';

import { Roles, ROLES, RESOURCES } from './fixtures';

const adapter = new MemoryAdapter(Roles as any[]);
const acl = new DotAccess(adapter);

test('overlap', async (t) => {
  const roleName = [ROLES.ADMINISTRATOR, ROLES.OPERATION];
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can(roleName, actionName, resourceName);
  const { access, granted, grants } = result;
  const { action, resource, roles } = access;
  const resources: { [k: string]: any } = {};
  const namedRoles = acl.adapter.getRolesByName(roleName) as Role[];

  t.is(granted, true);

  t.is(action, actionName);
  t.is(resource, resourceName);

  // expect(roles).to.be.an('array').to.be.eql(roleName);
  t.snapshot(roles);

  namedRoles.forEach((role) => {
    role.resources.forEach((res) => {
      resources[res.name] = res;
    });
  });

  // expect(grants).to.be.an('object').with.all.keys(Object.keys(resources));
  t.snapshot(grants);
});

test('result object with merged (union) actions inside resource', async (t) => {
  const roleName = [ROLES.ADMINISTRATOR, ROLES.OPERATION];
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], 'read', RESOURCES.PRODUCT);

  const {
    grants: { [resourceName]: gResource }
  } = result;
  const roles = acl.adapter.getRolesByName(roleName) as Role[];
  const actions: { [k: string]: any } = {};

  roles.forEach((role) => {
    role.resources.forEach((resource) => {
      if (resource.name === resourceName) {
        (resource.actions as Action[]).forEach((action) => {
          actions[action.name] = action;
        });
      }
    });
  });

  // expect(gResource).to.be.an('object').with.all.keys(Object.keys(actions));
  t.snapshot(actions);
  t.snapshot(gResource);
});

test('result object with the most permissive action applied', async (t) => {
  const result = await acl.can(
    [ROLES.ADMINISTRATOR, ROLES.OPERATION],
    'read',
    RESOURCES.CONFIGURATION
  );

  const { granted, grants } = result;
  const { [RESOURCES.CONFIGURATION]: resource } = grants;

  t.is(granted, true);
  t.is(resource, '*');
});

test('result object with the most permissive action applied and granted access to custom action', async (t) => {
  const result = await acl.can(
    [ROLES.ADMINISTRATOR, ROLES.OPERATION],
    'print',
    RESOURCES.CONFIGURATION
  );

  const { granted, grants } = result;
  const { [RESOURCES.CONFIGURATION]: resource } = grants;

  t.is(granted, true);
  t.is(resource, '*');
});

test('result object with all allowed attributes in action - all attributes', async (t) => {
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  // const RESULT = ['*', '!history'];
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('attributes')
  //   .to.be.an('array')
  //   .eql(RESULT);

  // expect(result).to.be.an('object').with.property('attributes').to.be.an('array').eql(RESULT);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all allowed attributes in action - filtered all attributes', async (t) => {
  const actionName = 'create';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('attributes')
  //   .to.be.an('array')
  //   .eql(['*']);

  // expect(result).to.be.an('object').with.property('attributes').to.be.an('array').eql(['*']);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all allowed attributes in action - projected attributes', async (t) => {
  const actionName = 'update';
  const resourceName = RESOURCES.ORDER;
  // const RESULT = ['status', 'items', 'delivery'];
  const result = await acl.can([ROLES.OPERATION, ROLES.SUPPORT], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('attributes')
  //   .to.be.an('array')
  //   .eql(RESULT);

  // expect(result).to.be.an('object').with.property('attributes').to.be.an('array').eql(RESULT);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all allowed attributes in action - mixed attributes', async (t) => {
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  // const RESULT = ['*', '!history'];
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('attributes')
  //   .to.be.an('array')
  //   .eql(RESULT);

  // expect(result).to.be.an('object').with.property('attributes').to.be.an('array').eql(RESULT);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all allowed attributes in action - negated attributes', async (t) => {
  const actionName = 'update';
  const resourceName = RESOURCES.PRODUCT;
  // const RESULT = ['*', '!history'];
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('attributes')
  //   .to.be.an('array')
  //   .eql(RESULT);

  // expect(result).to.be.an('object').with.property('attributes').to.be.an('array').eql(RESULT);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with the most permissive conditions applied', async (t) => {
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('conditions')
  //   .to.be.an('array')
  //   .eql([]);

  // expect(result).to.be.an('object').with.property('conditions').to.be.an('array').eql([]);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all conditions merged', async (t) => {
  const roleName = [ROLES.OPERATION, ROLES.SUPPORT];
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can(roleName, actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  const roles = acl.adapter.getRolesByName(roleName) as Role[];
  const conditions: any[] = [];

  roles.forEach((role) => {
    role.resources.forEach((res) => {
      if (res.name === resourceName) {
        (res.actions as Action[]).forEach((action) => {
          if (action.name === actionName && action.conditions != null) {
            conditions.push(...action.conditions);
          }
        });
      }
    });
  });

  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('conditions')
  //   .to.be.an('array')
  //   .eql(conditions);

  // expect(result)
  //   .to.be.an('object')
  //   .with.property('conditions')
  //   .to.be.an('array')
  //   .eql(conditions);
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with the most permissive scope applied', async (t) => {
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can([ROLES.ADMINISTRATOR, ROLES.OPERATION], actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('scope')
  //   .to.be.an('object')
  //   .eql({});

  // expect(result).to.be.an('object').with.property('scope').to.be.an('object').eql({});
  t.snapshot(resource);
  t.snapshot(result);
});

test('result object with all scopes merged', async (t) => {
  const roleName = [ROLES.OPERATION, ROLES.SUPPORT];
  const actionName = 'read';
  const resourceName = RESOURCES.PRODUCT;
  const result = await acl.can(roleName, actionName, resourceName);

  const {
    grants: { [resourceName]: resource }
  } = result;
  const roles = acl.adapter.getRolesByName(roleName) as Role[];
  const scope: any = {};

  roles.forEach((role) => {
    role.resources.forEach((res) => {
      if (res.name === resourceName) {
        (res.actions as Action[]).forEach((action) => {
          if (action.name === actionName && action.scope != null) {
            Object.entries(action.scope).forEach(([k, v]) => {
              scope[k] = v;
            });
          }
        });
      }
    });
  });

  // expect(resource)
  //   .to.be.an('object')
  //   .with.ownProperty(actionName)
  //   .with.ownProperty('scope')
  //   .to.be.an('object')
  //   .eql(scope);

  // expect(result).to.be.an('object').with.property('scope').to.be.an('object').eql(scope);
  t.snapshot(resource);
  t.snapshot(result);
});
