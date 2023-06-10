/* eslint-disable sort-keys */

import { MemoryAdapter, Role, SimpleAccess } from '../';

export const example = [
  {
    name: 'administrator',
    resources: [
      { name: 'product', actions: ['*'] },
      { name: 'order', actions: ['*'] },
      { name: 'file', actions: ['*'] }
    ]
  },
  {
    name: 'operation',
    resources: [
      {
        name: 'product',
        actions: [
          { name: 'create', attributes: ['*'] },
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['*', '!history'] },
          {
            name: 'delete',
            attributes: ['*'],
            conditions: [
              {
                'subject.id': {
                  $eq: 'resource.authorId'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'order',
        actions: [
          { name: 'create', attributes: ['*'] },
          { name: 'read', attributes: ['*'] },
          { name: 'update', attributes: ['*'] }
        ]
      }
    ]
  }
] as Role[];

// eslint-disable-next-line no-new
new SimpleAccess(new MemoryAdapter(example));
