import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { ArnFormat, Duration } from 'aws-cdk-lib';

import { DotStack } from '../constructs/Stack';

import { addTopic } from './sns';

export interface AddFunctionOptions {
  addEnvars?: string[];
  alarmEmail?: string;
  concurrency?: FunctionConcurrencyOptions;
  deadLetterQueue?: boolean;
  environmentVariables?: { [key: string]: string };
  handlerPath?: string;
  layerArns?: string[];
  layers?: LayerVersion[];
  memorySize?: number;
  name?: string;
  scope: DotStack;
  storageMb?: number;
  timeout?: Duration;
}

export interface FunctionConcurrencyOptions {
  provisioned?: {
    max: number;
    min?: number;
    /**
     * Begin scaling when the number of concurrent executions exceeds a percentage of `max`
     */
    percentage?: number;
  };
  reserved?: number;
}

interface GrantRemoteOptions {
  consumers: Array<Function | StateMachine>;
  functionName: string;
  scope: DotStack;
}

interface GrantSelfInvokeOptions {
  consumers: Array<Function | StateMachine>;
}

const FN_TIMEOUT = Duration.minutes(5);

export const addFunctionAlarms = (email: string, fn: Function, fnName: string, scope: DotStack) => {
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
