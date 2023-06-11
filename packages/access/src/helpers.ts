import sift from 'sift';
import floppyFilter from 'floppy-filter';
import isPlainObject from 'is-plain-obj';
import get from 'lodash.get';

import { Dict } from './types';
import { Permission } from './Permission';

const objectPrefix = 'resource.';
const subjectPrefix = 'subject.';

const isDate = (what: any) => what instanceof Date && !isNaN(what as any);
const isFunction = (what: any) => typeof what === 'function';
const isRegExp = (what: any) => what instanceof RegExp;
export const isString = (what: any) => typeof what === 'string';

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
export const canSubjectAccessResource = (
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
      const condition = conditions[i] as Record<string, any>;
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
