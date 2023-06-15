import type { Infer } from 'superstruct';

import type { Condition as BaseCondition } from './structs';
import { ActionStruct } from './structs';

// https://stackoverflow.com/questions/41139763/how-to-declare-a-fixed-length-array-in-typescript
type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift' | number;
type ArrayItems<T extends any[]> = T extends Array<infer TItems> ? TItems : never;
type FixedLengthArray<T extends any[]> = Pick<T, Exclude<keyof T, ArrayLengthMutationKeys>> & {
  [Symbol.iterator]: () => IterableIterator<ArrayItems<T>>;
};

export const ALL = '*';
export type Condition = BaseCondition;
export type Conditions = FixedLengthArray<['*']> | Record<string, Condition>[];

export interface Dict {
  [key: string]: any;
}

export interface Action extends Pick<Infer<typeof ActionStruct>, 'attributes' | 'name' | 'scope'> {
  conditions?: Conditions;
}

export interface Resource {
  actions: FixedLengthArray<['*']> | Action[];
  name: string;
}

export interface Role {
  name: string;
  resources: Resource[];
}
