import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketProps, EventType, NotificationKeyFilter } from 'aws-cdk-lib/aws-s3';
import { Effect, IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { S3EventSource, S3EventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';

import { Function } from 'aws-cdk-lib/aws-lambda';

import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { DotStack } from '../constructs/Stack';

import { addParam } from './ssm';
import { addNodeFunction, AddNodeFunctionOptions } from './node-function';

export { EventType } from 'aws-cdk-lib/aws-s3';
export { RemovalPolicy } from 'aws-cdk-lib';

interface BucketEventHandlerOptions {
  events: EventType[];
  handler: Omit<AddNodeFunctionOptions, 'scope'> | Function;
  keyFilters?: BucketKeyFilterOptions[];
}

interface BucketKeyFilterOptions extends NotificationKeyFilter {}

export interface AddBucketOptions {
  autoDelete?: boolean;
  expireAfterDays?: number;
  handlers?: BucketEventHandlerOptions[];
  name: string;
  publicObjects?: boolean;
  removalPolicy?: RemovalPolicy;
  scope: DotStack;
}

interface AddBucketResult {
  bucket: Bucket;
  params: { nameParam: StringParameter; arnParam: StringParameter };
}

interface GrantFullBucketAccessOptions {
  bucket: Bucket;
  consumers: IGrantable[];
}

export const addBucket = (options: AddBucketOptions): AddBucketResult => {
  const { autoDelete = true, expireAfterDays, handlers, name, publicObjects, scope } = options;
  let { removalPolicy = RemovalPolicy.RETAIN } = options;

  const baseName = DotStack.baseName(name, 'bucket');
  const bucketName = `${scope.appName}-${baseName}`;
  const lifeCycleRules = [];

  if (expireAfterDays && expireAfterDays > 0) {
    lifeCycleRules.push({
      enabled: true,
      expiration: Duration.days(expireAfterDays),
      id: `${bucketName}-expiration-rule`
    });
  }

  if (autoDelete || scope.env !== 'prod') removalPolicy = RemovalPolicy.DESTROY;

  const bucketProps: BucketProps = {
    autoDeleteObjects: autoDelete,
    bucketName,
    removalPolicy
  };

  const bucket = new Bucket(scope, bucketName, bucketProps);

  scope.overrideId(bucket, bucketName);

  if (publicObjects) bucket.grantPublicAccess(void 0, 's3:GetObject');

  const nameParam = addParam({
    id: `${bucketName}-name`,
    name: `${scope.ssmPrefix}/name/${baseName}`,
    value: bucket.bucketName,
    scope
  });

  const arnParam = addParam({
    id: `${bucketName}-arn`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: bucket.bucketArn
  });

  if (handlers) {
    handlers.forEach(({ events, keyFilters, handler }) => {
      const handlerFn =
        handler instanceof Function
          ? handler
          : addNodeFunction(Object.assign({ name: baseName }, handler as any, { scope }));

      const eventOptions: S3EventSourceProps = {
        events,
        filters: keyFilters
      };
      const eventSource = new S3EventSource(bucket, eventOptions);
      handlerFn.addEventSource(eventSource);

      nameParam.grantRead(handlerFn);
      arnParam.grantRead(handlerFn);

      bucket.grantReadWrite(handlerFn);
      bucket.grantDelete(handlerFn);
    });
  }

  return { bucket, params: { nameParam, arnParam } };
};

export const grantFullBucketAccess = async ({
  bucket,
  consumers
}: GrantFullBucketAccessOptions) => {
  consumers.forEach((consumer) =>
    consumer.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        effect: Effect.ALLOW,
        resources: [`${bucket.bucketArn}/*`]
      })
    )
  );
};
