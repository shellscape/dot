import sift from 'sift';
import floppyFilter from 'floppy-filter';
import isPlainObject from 'is-plain-obj';
import get from 'lodash.get';

import { ALL, Condition, Dict } from './types';
import { Permission } from './Permission';

const objectPrefix = 'resource.';
const subjectPrefix = 'subject.';

const isDate = (what: any) => what instanceof Date && !isNaN(what as any);
const isEmpty = (what: any) => !Object.keys(what || {}).length;
const isFunction = (what: any) => typeof what === 'function';
const isRegExp = (what: any) => what instanceof RegExp;
export const isString = (what: any) => typeof what === 'string';

export const difference = <TArray>(first: TArray[], second: TArray[]) =>
  first.filter((value) => !second.includes(value));
const intersection = <TArray>(array: TArray[], ...args: TArray[][]) =>
  array.filter((item) => args.every((arr) => arr.includes(item)));
export const union = <TArray>(array: TArray[], ...args: TArray[][]) => [
  ...new Set(array.concat(...args))
];

export const merge = (existing: string[], incoming: string[]): string[] => {
  const existingIsAll = existing[0] === ALL;
  const incomingIsAll = incoming[0] === ALL;

  if (!incomingIsAll && !existingIsAll) {
    const combined = union(incoming, existing).filter(
      (item) => item != null && !item.startsWith('!')
    );

    return [...combined];
  }

  if (incomingIsAll && existingIsAll) {
    const negated = intersection(incoming, existing).filter(
      (item) => item != null && !item.startsWith('!')
    );

    return [...negated];
  }

  if (incomingIsAll || existingIsAll) {
    const negated = union(incoming, existing).filter(
      (item: string) => item != null && !item.startsWith('!')
    );

    return [...negated];
  }

  return [];
};

export const mergeAttributes = (existing: string[], incoming: string[]): string[] => {
  const existingIsAll = incoming.length === 1 && incoming[0] === ALL;
  const incomingIsAll = existing.length === 1 && existing[0] === ALL;

  if (incomingIsAll) return existing;
  if (existingIsAll) {
    // If action or cached actions = ['*'] then, no need to merge
    // We take the most permissive attributes
    return [ALL];
  }

  return merge(existing || [], incoming || []);
};

export const mergeConditions = (existing: Condition[], incoming: Condition[]): Condition[] => {
  const existingIsEmpty = isEmpty(existing);

  if (isEmpty(incoming) && !existingIsEmpty) return [] as any;
  if (!existingIsEmpty) return [...existing, ...incoming];

  return [] as any;
};

export const mergeScope = <TScope extends {}>(existing: TScope, incoming: TScope): TScope => {
  const existingIsEmpty = isEmpty(existing);

  if (isEmpty(incoming) && !existingIsEmpty) return {} as TScope;
  if (!existingIsEmpty) return { ...existing, ...incoming };

  return {} as TScope;
};

/**
 * Check for prefix ["subject", "resource"] within string and substitute it
 * with the actual value from data object
 * @param param String to resolve Ex. "subject.address.city"
 * @param {Dict} subject Subject data
 * @param {Dict} resource  Resource data
 * @returns {any}
 */
export const resolveConditionParam = (param: any, subject: Dict, resource: Dict) => {
  let path: any;
  let data: any;
  if (param !== null && isString(param) && param.length > 0) {
    if (param.indexOf(subjectPrefix) === 0) {
      path = param.substr(subjectPrefix.length);
      data = subject;
    }
    if (param.indexOf(objectPrefix) === 0) {
      path = param.substr(objectPrefix.length);
      data = resource;
    }

    if (data != null) {
      return get(data, path);
    }
  }

  return param;
};

/**
 * Parse and substitute attribute values which starts with
 * ["subject", "resource"] prefixes with actual values
 * from "subject" or "object" data (It will not resolve keys)
 *
 * Ex. object:
 * {
 *   "subject.id": {"$eq": "object.userId"}
 * }
 *
 * Only "object.userId" will be substituted
 * @param condition
 * @param subject
 * @param resource
 * @returns object
 */
export const parseCondition = (condition: Dict, subject: Dict, resource: Dict) => {
  let result: { [k: string]: any } = {};

  if (isString(condition)) {
    result = resolveConditionParam(condition, subject, resource);
  } else if (
    isDate(condition) ||
    Array.isArray(condition) ||
    isFunction(condition) ||
    isRegExp(condition)
  ) {
    result = condition;
  } else if (isPlainObject<any>(condition)) {
    Object.entries(condition).forEach(([key, value]) => {
      result[key] = parseCondition(value, subject, resource);
    });
  } else {
    result = condition;
  }

  return result;
};

/**
 * check if permission allows subject (like user) to access resource,
 * role conditions will be evaluated for this check
 * @param permission Permission object
 * @param {Dict} subject User object
 * @param {Dict} resource Resource object
 * @returns {boolean}
 */
export const canAccessResource = (
  permission: Permission,
  subject: Dict,
  resource: Dict
): boolean => {
  let accessGranted = false;
  const { granted, conditions } = permission;

  if (granted === true) {
    if (conditions == null || conditions.length === 0) {
      return true;
    }

    for (let i = 0; i < conditions.length; i += 1) {
      const condition = (conditions as Condition[])[i] as Record<string, any>;
      try {
        if (!isPlainObject<any>(condition)) {
          throw new RangeError('Condition must be an object');
        }

        const [[key, query]] = Object.entries(condition);
        const pKey = resolveConditionParam(key, subject, resource);
        const pQuery = parseCondition(query, subject, resource);
        accessGranted = sift(pQuery).call(this, pKey);

        if (!accessGranted) {
          break;
        }
      } catch (error) {
        return false;
      }
    }
  }

  return accessGranted;
};

export const filter = (permission: Permission, data: Dict) => {
  const { attributes } = permission;
  if (data != null) {
    return floppyFilter.filterAll(data, attributes);
  }

  return data;
};
