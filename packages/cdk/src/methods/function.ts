import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Alias, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { ArnFormat, Duration } from 'aws-cdk-lib';
import { log } from '@dot/log';
import chalk from 'chalk';

import { DotStack } from '../constructs/Stack';

import { addTopic } from './sns';

export interface AddFunctionOptions {
  addEnvars?: string[];
  alarmEmail?: string;
  concurrency?: FunctionConcurrencyOptions;
  deadLetterQueue?: boolean;
  environmentVariables?: { [key: string]: string };
  handlerPath?: string;
  layers?: LayerVersion[];
  layerArns?: string[];
  memorySize?: number;
  name?: string;
  scope: DotStack;
  storageMb?: number;
  sourcePath: string;
  timeout?: Duration;
}

export interface FunctionConcurrencyOptions {
  reserved?: number;
  provisioned?: {
    min?: number;
    max: number;
    /**
     * Begin scaling when the number of concurrent executions exceeds a percentage of `max`
     */
    percentage?: number;
  };
}

interface GrantRemoteOptions {
  consumers: Array<Function | StateMachine>;
  functionName: string;
  scope: DotStack;
}

interface GrantSelfInvokeOptions {
  consumers: Array<Function | StateMachine>;
}

interface SetupFunctionArgs {
  fnName: string;
  handler: Function;
  options: AddFunctionOptions;
}

const FN_TIMEOUT = Duration.minutes(5);

export const setupFunction = ({ fnName, handler, options }: SetupFunctionArgs) => {
  const { addEnvars, alarmEmail, concurrency, environmentVariables = {}, layers, layerArns, scope } = options;

  if (concurrency?.provisioned) {
    log.info(' - Provisioning Concurrency for:', chalk.dim(fnName));

    if (concurrency?.provisioned?.max <= 0)
      throw new RangeError(`concurrency.provisioned.max needs to be greater than 0`);

    const aliasName = `${fnName}-alias`;
    const alias = new Alias(scope, aliasName, { aliasName, version: handler.latestVersion });
    const scaling = alias.addAutoScaling({
      minCapacity: Math.ceil(concurrency.provisioned.min || 1),
      maxCapacity: Math.ceil(concurrency.provisioned.max)
    });

    scaling.scaleOnUtilization({ utilizationTarget: concurrency.provisioned.percentage || 0.5 });
  }
  // TODO: Add schedule based provisioning
  // https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html#autoscaling

  if (layerArns?.length) {
    const layerVersion = layerArns.map((arn, index) =>
      LayerVersion.fromLayerVersionArn(scope, `${handler.functionName}-layer-${index}`, arn)
    );
    handler.addLayers(...layerVersion);
  }

  if (layers?.length) handler.addLayers(...layers);

  scope.overrideId(handler, fnName);

  addEnvars
    // we don't want to override envars that we've already specified
    ?.filter((varName) => !environmentVariables[varName])
    .forEach((varName) => {
      const value = process.env[varName];
      // eslint-disable-next-line no-unused-expressions
      value && handler.addEnvironment(varName, value);
    });

  if (alarmEmail) addAlarms(alarmEmail, handler, fnName.replace(`${scope.env}-`, ''), scope);

  return handler;
};

const addAlarms = (email: string, fn: Function, fnName: string, scope: DotStack) => {
  if (scope.env !== 'prod') return;

  const { topic } = addTopic({
    emailAddress: email,
    name: `${fnName}-alarm-email`,
    scope
  });
  const action = new SnsAction(topic);

  const errorAlarmName = `${fnName}-error-alarm`;
  fn.metricErrors()
    .createAlarm(scope, errorAlarmName, {
      alarmName: errorAlarmName,
      datapointsToAlarm: 1,
      evaluationPeriods: 1,
      threshold: 5
    })
    .addAlarmAction(action);

  const timeoutAlarmName = `${fnName}-timeout-alarm`;
  fn.metricDuration()
    .with({ statistic: 'Maximum' })
    .createAlarm(scope, timeoutAlarmName, {
      alarmName: timeoutAlarmName,
      datapointsToAlarm: 1,
      evaluationPeriods: 1,
      threshold: (fn.timeout || FN_TIMEOUT).toMilliseconds(),
      treatMissingData: TreatMissingData.IGNORE
    })
    .addAlarmAction(action);
};

export const grantRemoteInvoke = ({ consumers, functionName, scope }: GrantRemoteOptions) => {
  consumers.forEach((fn) =>
    fn.role!.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeAsync', 'lambda:InvokeFunction'],
        effect: Effect.ALLOW,
        resources: [
          scope.formatArn({
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
            resource: 'function',
            resourceName: `${functionName}*`,
            service: 'lambda'
          })
        ]
      })
    )
  );
};

// see: https://github.com/aws/aws-cdk/issues/11020
// for why this is here, and why we need a ['*'] resource to dodge a circular ref in CloudFormation
export const grantSelfInvoke = ({ consumers }: GrantSelfInvokeOptions) => {
  consumers.forEach((fn) =>
    fn.role!.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeAsync', 'lambda:InvokeFunction'],
        effect: Effect.ALLOW,
        resources: ['*']
      })
    )
  );
};
