/* eslint-disable sort-keys */

import {
  any,
  array,
  assert,
  literal,
  nonempty,
  object,
  optional,
  pattern,
  record,
  size,
  string,
  union,
  Infer
} from 'superstruct';

export const siftMethods = [
  '$all',
  '$and',
  '$elemMatch',
  '$eq',
  '$exists',
  '$gt',
  '$gte',
  '$in',
  '$lt',
  '$lte',
  '$mod',
  '$ne',
  '$nin',
  '$nor',
  '$not',
  '$options',
  '$or',
  '$regex',
  '$size',
  '$type',
  '$where'
] as const;

const reConditionMethods = new RegExp(
  `^(${siftMethods.map((name) => name.replace('$', '\\$')).join('|')})$`
);
const WildcardStruct = size(array(literal('*')), 1);

export const ConditionStruct = union([
  string(),
  record(string(), record(pattern(string(), reConditionMethods), any()))
]);
export const ConditionsStruct = union([WildcardStruct, size(array(ConditionStruct), 0, 64)]);

export const AttributesStruct = size(array(string()), 1, 64);

export const ActionStruct = object({
  // TODO: add "unique" struct
  attributes: AttributesStruct,
  conditions: optional(ConditionsStruct),
  name: string(),
  scope: optional(record(string(), any()))
});

// TODO: add "unique" struct
const ActionArrayStruct = size(array(ActionStruct), 1, 64);

export const ResourceStruct = object({
  name: string(),
  actions: union([ActionArrayStruct, WildcardStruct])
});

export const RoleStruct = object({
  name: string(),
  // TODO: add "unique" struct
  resources: size(array(ResourceStruct), 1, 1024)
});

export const SchemaStruct = nonempty(array(RoleStruct));

export type Action = Infer<typeof ActionStruct>;
export type Attributes = Infer<typeof AttributesStruct>;
export type ConditionMethod = (typeof siftMethods)[number];
export type ConditionMethodRecord = { [key in ConditionMethod]?: any };
export type Condition = Record<string, ConditionMethodRecord>;
export type Conditions = Infer<typeof ConditionsStruct>;
export type Resource = Infer<typeof ResourceStruct>;
export type Role = Infer<typeof RoleStruct>;
export type Schema = Infer<typeof SchemaStruct>;

export const checkSchema = (what: any) => assert(what, SchemaStruct);
export const checkRole = (what: any) => assert(what, RoleStruct);

// export const roleSchema = {
//   type: 'object',
//   properties: {
//     name: { type: 'string' },
//     resources: {
//       type: 'array',
//       maxItems: 1024,
//       uniqueItems: true,
//       items: {
//         type: 'object',
//         properties: {
//           name: { type: 'string' },
//           actions: {
//             oneOf: [
//               // {
//               //   type: 'array',
//               //   minItems: 1,
//               //   maxItems: 1,
//               //   items: { const: '*' }
//               // },
//               {
//                 type: 'array',
//                 // minItems: 1,
//                 // maxItems: 64,
//                 // uniqueItems: true,
//                 items: {
//                   type: 'object',
//                   properties: {
//                     name: { type: 'string' },
//                     attributes: {
//                       type: 'array',
//                       minItems: 1,
//                       maxItems: 64,
//                       uniqueItems: true,
//                       items: { type: 'string' }
//                     },
//                     conditions: {
//                       type: 'array',
//                       minItems: 0,
//                       maxItems: 64,
//                       uniqueItems: true,
//                       items: { type: 'object' }
//                     },
//                     scope: { type: 'object' }
//                   },
//                   required: ['name', 'attributes'],
//                   additionalProperties: false
//                 }
//               }
//             ]
//           }
//         }
//         // required: ['name', 'actions'],
//         // additionalProperties: false
//       }
//     }
//   }
//   // required: ['name', 'resources'],
//   // additionalProperties: false
// };
