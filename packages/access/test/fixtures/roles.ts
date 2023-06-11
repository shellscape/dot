/* eslint-disable sort-keys */

import type { Role } from '../../src/structs';

import { RESOURCES } from './resources';

export const ROLES = {
  ADMINISTRATOR: 'administrator',
  OPERATION: 'operation',
  SUPPORT: 'support'
};

export const Roles: Role[] = [
  {
    name: ROLES.ADMINISTRATOR,
    resources: [
      {
        name: RESOURCES.CONFIGURATION,
        actions: ['*']
      },
      {
        name: RESOURCES.FILE,
        actions: ['*']
      },
      {
        name: RESOURCES.USER,
        actions: [
          { name: 'create', attributes: ['*'] },
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['*'] }
        ]
      },
      {
        name: RESOURCES.PRODUCT,
        actions: [
          { name: 'create', attributes: ['*', 'active'] },
          { name: 'read', attributes: ['active'] },
          { name: 'update', attributes: ['*', '!history'] },
          { name: 'delete', attributes: ['*'] }
        ]
      },
      {
        name: RESOURCES.ORDER,
        actions: [
          { name: 'create', attributes: ['*'] },
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['*'] }
        ]
      }
    ]
  },
  {
    name: ROLES.OPERATION,
    resources: [
      {
        name: RESOURCES.CONFIGURATION,
        actions: [
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['status', 'items'] }
        ]
      },
      {
        name: RESOURCES.ORDER,
        actions: [
          { name: 'read', attributes: ['*'] },
          { name: 'create', attributes: ['*'] },
          {
            name: 'update',
            attributes: ['status', 'items', 'delivery']
          }
        ]
      },
      {
        name: RESOURCES.PRODUCT,
        actions: [
          { name: 'create', attributes: ['*', 'active'] },
          {
            name: 'read',
            attributes: ['*', '!history'],
            conditions: [
              { 'subject.id': { $eq: 'resource.authorId' } },
              { 'subject.id': { $ne: void 0 as any } }
            ],
            scope: {
              valid: true
            }
          },
          {
            name: 'update',
            attributes: ['*', '!history', '!active']
          }
        ]
      }
    ]
  },
  {
    name: ROLES.SUPPORT,
    resources: [
      {
        name: RESOURCES.USER,
        actions: [
          {
            name: 'update',
            attributes: ['*', '!password']
          },
          {
            name: 'update',
            attributes: ['firstName', 'lastName'],
            conditions: [
              {
                'resource.createdAt': {
                  $lte: new Date('2020-10-21T06:00:00Z')
                }
              }
            ]
          }
        ]
      },
      {
        name: RESOURCES.ORDER,
        actions: [
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['status', 'items'] },
          {
            name: 'export',
            attributes: ['*'],
            conditions: [
              {
                'resource.items': {
                  $where(): any {
                    return (this as any).count >= 9;
                  }
                }
              }
            ]
          }
        ]
      },
      {
        name: RESOURCES.PRODUCT,
        actions: [
          {
            name: 'read',
            attributes: ['*', '!isActive'],
            conditions: [
              { 'subject.address.country': { $eq: 'Canada' } },
              { 'resource.sku': { $lte: 5000 } },
              {
                'resource.createdAt': {
                  $gte: new Date('2020-10-21T06:00:00Z')
                }
              }
            ],
            scope: {
              namespace: '*.merchant.products',
              products: [1, 229, 3394]
            }
          }
        ]
      }
    ]
  }
];
