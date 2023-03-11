import { SqsEventSource, SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { DeadLetterQueue, Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { nanoid } from 'nanoid';

import { DotStack } from '../constructs/Stack';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function';
import { addParam } from './ssm';

interface DeadLetterQueueOptions extends Omit<AddQueueOptions, 'key' | 'name' | 'scope'> {
  maxReceiveCount?: number;
}

interface AddQueueOptions {
  batchSize?: number;
  consumers?: IGrantable[];
  deadLetter?: DeadLetterQueueOptions;
  deliveryDelay?: Duration;
  encrypted?: Boolean;
  handler?: Omit<AddNodeFunctionOptions, 'scope'> | Function;
  key?: Key;
  /**
   * Default: 10. If batchSize > 10, this property is set when assigning a queue handler as an
   * event source
   */
  maxBatchingWindowSeconds?: number;
  maxMessageSizeBytes?: number;
  name?: string;
  retentionPeriod?: Duration;
  scope: DotStack;
  visibilityTimeout?: Duration;
}

interface AddQueueResultParams {
  arnParam: StringParameter;
  urlParam: StringParameter;
}

interface AddQueueResult {
  deadLetterQueue?: Queue;
  dlqParams?: AddQueueResultParams;
  handler?: Function;
  params: AddQueueResultParams;
  queue: Queue;
}

interface GrantRemoteOptions {
  consumers?: IGrantable[];
  producers?: IGrantable[];
  queueArn: string;
  scope: DotStack;
}

export type QueueHandler = Function;

export const addQueue = (options: AddQueueOptions): AddQueueResult => {
  const {
    batchSize = 1,
    consumers = [],
    deadLetter,
    deliveryDelay,
    encrypted = true,
    handler,
    key,
    maxBatchingWindowSeconds = 10,
    maxMessageSizeBytes = 256e3,
    name = '',
    retentionPeriod = Duration.days(1),
    scope,
    visibilityTimeout = Duration.seconds(30)
  } = options;
  const baseName = DotStack.baseName(name, 'queue');
  const queueName = `${scope.appName}-${baseName}`;
  let deadLetterQueue: DeadLetterQueue | undefined = void 0;
  let handlerFn: QueueHandler | undefined = void 0;
  let dlqParams: AddQueueResultParams | undefined = void 0;

  if (deadLetter) {
    const { queue, params } = addQueue({ ...deadLetter, consumers, name: `${name}-dlq`, scope });
    dlqParams = params;
    deadLetterQueue = {
      maxReceiveCount: deadLetter?.maxReceiveCount ?? 1,
      queue
    };
  }

  const encryption = encrypted
    ? key
      ? QueueEncryption.KMS
      : QueueEncryption.KMS_MANAGED
    : QueueEncryption.UNENCRYPTED;

  const queue: Queue = new Queue(scope, queueName, {
    dataKeyReuse: Duration.minutes(5),
    deadLetterQueue,
    deliveryDelay,
    encryption,
    encryptionMasterKey: key,
    maxMessageSizeBytes,
    queueName,
    retentionPeriod,
    visibilityTimeout
  });

  // FIXME: We need to figure out how to properly add this. At the moment, it throws an error about
  // there needing to be a principal policy
  // queue.addToResourcePolicy(
  //   new PolicyStatement({
  //     actions: ['xray:*'],
  //     effect: Effect.ALLOW,
  //     resources: [queue.queueArn]
  //   })
  // );

  scope.overrideId(queue, queueName);

  const arnParam = addParam({
    id: `${queueName}-arn`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: queue.queueArn
  });

  const urlParam = addParam({
    id: `${queueName}-url`,
    name: `${scope.ssmPrefix}/url/${baseName}`,
    scope,
    value: queue.queueUrl
  });

  if (handler) {
    if (handler instanceof Function) handlerFn = handler;
    else
      handlerFn = addNodeFunction(
        Object.assign({ name: baseName }, options.handler as any, { scope })
      );

    const eventOptions: SqsEventSourceProps = {
      batchSize,
      reportBatchItemFailures: true
    };

    if (batchSize > 10)
      (eventOptions as any).maxBatchingWindow = Duration.seconds(maxBatchingWindowSeconds);

    const eventSource = new SqsEventSource(queue, eventOptions);
    key?.grant(handlerFn, 'kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey');
    handlerFn.addEventSource(eventSource);

    arnParam.grantRead(handlerFn);
    urlParam.grantRead(handlerFn);
  }

  consumers.forEach((resource) => {
    key?.grant(resource, 'kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey');
    handlerFn && handlerFn.grantInvoke(resource);
    arnParam.grantRead(resource);
    urlParam.grantRead(resource);
    queue.grantSendMessages(resource);
    queue.grantConsumeMessages(resource);
  });

  return {
    deadLetterQueue: deadLetterQueue?.queue as Queue | undefined,
    dlqParams,
    handler: handlerFn,
    params: { arnParam, urlParam },
    queue
  };
};

export const grantRemoteQueue = ({
  consumers = [],
  producers = [],
  queueArn,
  scope
}: GrantRemoteOptions) => {
  const queue = Queue.fromQueueAttributes(scope, `${nanoid()}-grantRemoteQueue`, {
    queueArn
  });

  consumers.forEach((resource) => {
    queue.grantConsumeMessages(resource);
    queue.encryptionMasterKey?.grant(
      resource,
      'kms:Decrypt',
      'kms:DescribeKey',
      'kms:GenerateDataKey'
    );
  });
  producers.forEach((resource) => {
    queue.grantSendMessages(resource);
    queue.encryptionMasterKey?.grant(
      resource,
      'kms:Decrypt',
      'kms:DescribeKey',
      'kms:GenerateDataKey'
    );
  });
};
