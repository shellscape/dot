# Snapshot report for `test/MemoryStore.ts`

The actual snapshot is saved in `MemoryStore.ts.snap`.

Generated by [AVA](https://avajs.dev).

## Should return error when passing invalid roles array

> Snapshot 1

    RangeError {
      message: 'Missing/Invalid roles array in "MemoryStore"',
    }

## Should return empty array because role(s) does not exists

> Snapshot 1

    []

## Should return validation error when calling "getRolesByName" with invalid roles

> Snapshot 1

    RangeError {
      message: '`names` must be an array with a non-zero length',
    }

## Should return array of roles when calling "getRolesByName"

> Snapshot 1

    [
      {
        name: 'administrator',
        resources: [
          {
            actions: [
              '*',
            ],
            name: 'configuration',
          },
          {
            actions: [
              '*',
            ],
            name: 'file',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'update',
              },
            ],
            name: 'user',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                  'active',
                ],
                name: 'create',
              },
              {
                attributes: [
                  'active',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                  '!history',
                ],
                name: 'update',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'delete',
              },
            ],
            name: 'product',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'update',
              },
            ],
            name: 'order',
          },
        ],
      },
      {
        name: 'operation',
        resources: [
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  'status',
                  'items',
                ],
                name: 'update',
              },
            ],
            name: 'configuration',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  'status',
                  'items',
                  'delivery',
                ],
                name: 'update',
              },
            ],
            name: 'order',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                  'active',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                  '!history',
                ],
                conditions: [
                  {
                    'subject.id': {
                      $eq: 'resource.authorId',
                    },
                  },
                  {
                    'subject.id': {
                      $ne: undefined,
                    },
                  },
                ],
                name: 'read',
                scope: {
                  valid: true,
                },
              },
              {
                attributes: [
                  '*',
                  '!history',
                  '!active',
                ],
                name: 'update',
              },
            ],
            name: 'product',
          },
        ],
      },
    ]

## Should return array of roles when accessing "roles"

> Snapshot 1

    [
      {
        name: 'administrator',
        resources: [
          {
            actions: [
              '*',
            ],
            name: 'configuration',
          },
          {
            actions: [
              '*',
            ],
            name: 'file',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'update',
              },
            ],
            name: 'user',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                  'active',
                ],
                name: 'create',
              },
              {
                attributes: [
                  'active',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                  '!history',
                ],
                name: 'update',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'delete',
              },
            ],
            name: 'product',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'update',
              },
            ],
            name: 'order',
          },
        ],
      },
      {
        name: 'operation',
        resources: [
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  'status',
                  'items',
                ],
                name: 'update',
              },
            ],
            name: 'configuration',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  '*',
                ],
                name: 'create',
              },
              {
                attributes: [
                  'status',
                  'items',
                  'delivery',
                ],
                name: 'update',
              },
            ],
            name: 'order',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                  'active',
                ],
                name: 'create',
              },
              {
                attributes: [
                  '*',
                  '!history',
                ],
                conditions: [
                  {
                    'subject.id': {
                      $eq: 'resource.authorId',
                    },
                  },
                  {
                    'subject.id': {
                      $ne: undefined,
                    },
                  },
                ],
                name: 'read',
                scope: {
                  valid: true,
                },
              },
              {
                attributes: [
                  '*',
                  '!history',
                  '!active',
                ],
                name: 'update',
              },
            ],
            name: 'product',
          },
        ],
      },
      {
        name: 'support',
        resources: [
          {
            actions: [
              {
                attributes: [
                  '*',
                  '!password',
                ],
                name: 'update',
              },
              {
                attributes: [
                  'firstName',
                  'lastName',
                ],
                conditions: [
                  {
                    'resource.createdAt': {
                      $lte: Date 2020-10-21 06:00:00 UTC {},
                    },
                  },
                ],
                name: 'update',
              },
            ],
            name: 'user',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                ],
                name: 'read',
              },
              {
                attributes: [
                  'status',
                  'items',
                ],
                name: 'update',
              },
              {
                attributes: [
                  '*',
                ],
                conditions: [
                  {
                    'resource.items': {
                      $where: Function $where {},
                    },
                  },
                ],
                name: 'export',
              },
            ],
            name: 'order',
          },
          {
            actions: [
              {
                attributes: [
                  '*',
                  '!isActive',
                ],
                conditions: [
                  {
                    'subject.address.country': {
                      $eq: 'Canada',
                    },
                  },
                  {
                    'resource.sku': {
                      $lte: 5000,
                    },
                  },
                  {
                    'resource.createdAt': {
                      $gte: Date 2020-10-21 06:00:00 UTC {},
                    },
                  },
                ],
                name: 'read',
                scope: {
                  namespace: '*.merchant.products',
                  products: [
                    1,
                    229,
                    3394,
                  ],
                },
              },
            ],
            name: 'product',
          },
        ],
      },
    ]