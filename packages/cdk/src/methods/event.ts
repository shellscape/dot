import { Duration } from 'aws-cdk-lib';
import { CronOptions, IRuleTarget, Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction as LambdaTarget } from 'aws-cdk-lib/aws-events-targets';
import { Function } from 'aws-cdk-lib/aws-lambda';

import { DotStack } from '../constructs/Stack';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function';

export type CronExpression = string;

export interface AddCronOptions {
  cron?: CronOptions | CronExpression;
  handler: Omit<AddNodeFunctionOptions, 'scope' | 'name'> | Function;
  input?: any;
  name?: string;
  rate?: Duration;
  scope: DotStack;
}

interface AddCronResult {
  handler: Function;
  rule: Rule;
}

/**
 * @description Adds a new Rule to the stack, which executes a lambda function on a periodic
 *              schedule, emulating a cron job https://en.wikipedia.org/wiki/Cron
 */
export const addCron = (options: AddCronOptions): AddCronResult => {
  const { cron, handler, input, name = '', rate, scope } = options;
  const baseName = DotStack.baseName(name, 'cron');
  const cronName = `${scope.appName}-${baseName}`;

  if (!cron && !rate) {
    throw RangeError('addCron: Either `cron` or `rate` must be specified');
  }

  const schedule = cron
    ? typeof cron === 'string'
      ? Schedule.expression(`cron(${cron})`)
      : Schedule.cron(cron)
    : Schedule.rate(rate!);
  const cronHandler =
    handler instanceof Function
      ? handler
      : addNodeFunction({ ...(handler as any), name: baseName, scope });
  const targetOptions = input ? { event: RuleTargetInput.fromObject(input) } : void 0;
  const targets: IRuleTarget[] = [new LambdaTarget(cronHandler, targetOptions)];
  const rule = new Rule(scope, cronName, { ruleName: cronName, schedule, targets });

  scope.overrideId(rule, cronName);

  return { handler: cronHandler, rule };
};
