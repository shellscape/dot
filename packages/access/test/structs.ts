/* eslint-disable no-new, sort-keys */

import test from 'ava';
import { assert } from 'superstruct';

import type { Action, Condition, Resource } from '../src/structs';
import { ActionStruct, AttributesStruct, ConditionStruct, ResourceStruct } from '../src/structs';

test('AttributesStruct', async (t) => {
  const attributes = ['*'];
  assert(attributes, AttributesStruct);
  t.pass();
});

test('ConditionStruct', async (t) => {
  const condition = {
    'resource.createdAt': {
      $lte: new Date('2020-10-21T06:00:00Z')
    }
  } as Condition;
  assert(condition, ConditionStruct);
  t.pass();
});

test('ActionStruct', async (t) => {
  const action = {
    name: 'update',
    attributes: ['firstName', 'lastName'],
    conditions: [
      {
        'resource.createdAt': {
          $lte: new Date('2020-10-21T06:00:00Z')
        }
      }
    ]
  } as Action;
  assert(action, ActionStruct);
  t.pass();
});

test('ResourceStruct', async (t) => {
  const resource = {
    name: 'user',
    actions: [
      {
        name: 'update',
        attributes: ['*', '!password']
      },
      {
        name: 'update',
        attributes: ['firstName', 'lastName'],
        conditions: [
          { 'subject.address.country': { $eq: 'Canada' } },
          { 'resource.sku': { $lte: 5000 } },
          {
            'resource.createdAt': {
              $gte: new Date('2020-10-21T06:00:00Z')
            }
          }
        ]
      }
    ]
  } as Resource;
  assert(resource, ResourceStruct);
  t.pass();
});
