import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import type { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket, BucketProps, EventType, NotificationKeyFilter } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { S3EventSource, S3EventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { DotStack } from '../constructs/Stack';
import { log } from '../log';

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

export interface AddBucketDeploymentOptions {
  bucket: Bucket;
  distribution?: IDistribution;
  invalidateCache?: boolean;
  removalPolicy?: RemovalPolicy.DESTROY | RemovalPolicy.RETAIN;
  scope: DotStack;
  sourcePath: string;
}

export interface AddBucketDeploymentResult {
  deployment: BucketDeployment;
}

export interface AddBucketOptions {
  autoDelete?: boolean;
  expireAfterDays?: number;
  handlers?: BucketEventHandlerOptions[];
  name: string;
  publicReadAccess?: boolean;
  removalPolicy?: RemovalPolicy;
  scope: DotStack;
  /*
   * If true, enables static website hosting for the bucket. An `index.html` file must exist within the bucket contents.
   */
  staticHosting?: boolean;
}

interface AddBucketResult {
  bucket: Bucket;
  deployment?: BucketDeployment;
  params: { arnParam: StringParameter; nameParam: StringParameter };
}

interface GrantFullBucketAccessOptions {
  bucket?: Bucket;
  bucketName?: string;
  consumers: IGrantable[];
  scope: DotStack;
}

export const addBucket = (options: AddBucketOptions): AddBucketResult => {
  const {
    autoDelete = true,
    expireAfterDays,
    handlers,
    name,
    publicReadAccess,
    staticHosting,
    scope
  } = options;
  let { removalPolicy = RemovalPolicy.RETAIN } = options;

  const baseName = DotStack.baseName(name, 'bucket');
  const bucketName = scope.resourceName(baseName);
  const lifeCycleRules = [];
  const websiteIndexDocument = staticHosting ? 'index.html' : void 0;

  log.info('Creating Bucket:', { baseName, bucketName, name });

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
    publicReadAccess,
    removalPolicy,
    websiteIndexDocument
  };

  const bucket = new Bucket(scope, bucketName, bucketProps);

  scope.overrideId(bucket, bucketName);

  if (publicReadAccess) bucket.grantPublicAccess(void 0, 's3:GetObject');

  const nameParam = addParam({
    id: `${bucketName}-name`,
    name: `${scope.ssmPrefix}/name/${baseName}`,
    scope,
    value: bucket.bucketName
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

  return { bucket, params: { arnParam, nameParam } };
};

export const addBucketDeployment = (
  options: AddBucketDeploymentOptions
): AddBucketDeploymentResult => {
  const {
    bucket,
    distribution,
    invalidateCache,
    removalPolicy = RemovalPolicy.DESTROY,
    scope,
    sourcePath
  } = options;
  const distributionPaths = distribution && invalidateCache ? ['/**/*', '/*'] : void 0;
  const deployment = new BucketDeployment(scope, `bucket-deploy-${+new Date()}`, {
    destinationBucket: bucket,
    distribution,
    distributionPaths,
    logRetention: RetentionDays.ONE_WEEK,
    retainOnDelete: removalPolicy === RemovalPolicy.RETAIN,
    sources: [Source.asset(sourcePath)]
  });

  if (invalidateCache && !distribution) {
    log.warn(
      'addBucketDeployment → invalidateCache has no effect without specifying a distributon'
    );
  }

  return { deployment };
};

export const grantFullBucketAccess = async ({
  bucket,
  bucketName,
  consumers,
  scope
}: GrantFullBucketAccessOptions) => {
  if (!bucket && !bucketName) throw new RangeError('bucket or bucketName must be specified');

  const target =
    bucket || Bucket.fromBucketName(scope, `fromBucketName-${+new Date()}`, bucketName!);

  consumers.forEach((consumer) => {
    target.grantReadWrite(consumer);
  });
};
