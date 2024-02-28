import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  CronOptions,
  EventBus,
  IRuleTarget,
  Rule,
  RuleTargetInput,
  Schedule
} from 'aws-cdk-lib/aws-events';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { LambdaFunction as LambdaTarget, SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { Function } from 'aws-cdk-lib/aws-lambda';

import { DotStack } from '../constructs/Stack';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function';
import { addParam } from './ssm';

export type CronExpression = string;

export interface AddBusOptions {
  name?: string;
  scope: DotStack;
}

interface AddBusResult {
  bus: EventBus;
  param: ReturnType<typeof addParam>;
}

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

interface AddRuleOptions {
  bus?: EventBus;
  busName?: string;
  eventName: string;
  name?: string;
  queue?: Queue;
  queueArn?: string;
  scope: DotStack;
}

export const addBus = (options: AddBusOptions): AddBusResult => {
  const { name = '', scope } = options;
  const baseName = DotStack.baseName(name, 'bus');
  const eventBusName = scope.resourceName(baseName);
  const bus = new EventBus(scope, eventBusName, { eventBusName });
  const param = addParam({
    id: `${eventBusName}-url`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: bus.eventBusArn
  });

  scope.overrideId(bus, eventBusName);

  return { bus, param };
};

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

export const addRule = (options: AddRuleOptions) => {
  const { bus, busName, eventName, name = '', scope, queue, queueArn } = options;

  if (!bus && !busName)
    throw new RangeError('`addRule` requires either `bus` or `busName` option to be passed');

  const eventBus =
    bus || EventBus.fromEventBusName(scope, `events-bus-from-name-${Date.now()}`, busName!);
  const ruleName = scope.resourceName(DotStack.baseName(name, 'rule'));
  const rule = new Rule(scope, ruleName, {
    eventBus,
    eventPattern: {
      detailType: [eventName]
    },
    ruleName
  });

  scope.overrideId(rule, ruleName);

  if (queue || queueArn) {
    const targetQueue =
      queue || Queue.fromQueueArn(scope, `rule-queue-from-arn-${Date.now()}`, queueArn!);
    const target = new SqsQueue(targetQueue);
    rule.addTarget(target);
  }

  rule.applyRemovalPolicy(RemovalPolicy.DESTROY);

  return rule;
};
