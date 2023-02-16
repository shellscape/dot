import { readFileSync } from 'fs';

import { CfnStateMachine, LogLevel, Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { log } from '@dot/log';
import chalk from 'chalk';

import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

import { DotStack } from '../constructs/Stack';

export interface AddStepFunctionOptions {
  definitionFile?: string;
  definitionString?: string;
  logRetention?: RetentionDays;
  name?: string;
  scope: DotStack;
}

/**
 * @description Adds a new Step Function StateMachine to the stack, using the
 *              supplied definition JSON string or file, and enables Cloudwatch logging
 */

export const addStepFunction = (options: AddStepFunctionOptions) => {
  const {
    definitionString,
    definitionFile,
    name,
    scope,
    logRetention = RetentionDays.TWO_WEEKS
  } = options;
  const prefix = name ? `${name}-` : '';
  const fnName = `${scope.appName}-${prefix}sfn`;

  if (!definitionFile && !definitionString) {
    throw new RangeError(
      'addSfn: Either `definitionString` or `definitionFile` must be specified.'
    );
  }
  let definitionJson = definitionString;
  if (!definitionJson) {
    definitionJson = readFileSync(definitionFile!).toString();
  }
  log.debug(definitionJson);

  // TODO: maybe move this to it's own module
  const logName = `${fnName}-logs`;
  const logGroup = new LogGroup(scope, logName, {
    retention: logRetention
  });
  log.info('Creating logGroup:', chalk.dim(logName));
  scope.overrideId(logGroup, logName);

  // can't import these directly from json :facepalm:
  // see https://github.com/aws/aws-cdk/issues/8146
  // so we'll create a dummy machine with a Pass node
  // and load our JSON into it
  const stateMachine = new StateMachine(scope, fnName, {
    definition: new Pass(scope, 'StartState'),
    logs: {
      destination: logGroup,
      level: LogLevel.ALL
    }
  });
  const cfnStateMachine = stateMachine.node.defaultChild as CfnStateMachine;
  cfnStateMachine.definitionString = definitionJson;

  log.info('Creating Step Function:', chalk.dim(fnName));
  scope.overrideId(stateMachine, fnName);

  return stateMachine;
};
