import { AssertionError } from 'assert';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import type { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import {
  BlockPublicAccess,
  Bucket,
  BucketProps,
  EventType,
  HttpMethods,
  LifecycleRule,
  NotificationKeyFilter
} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { S3EventSource, S3EventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { nanoid } from 'nanoid';

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
  autoDeleteObjects?: boolean;
  cors?: boolean;
  expireAfterDays?: number;
  handlers?: BucketEventHandlerOptions[];
  name: string;
  publicReadAccess?: boolean;
  /*
   * @desc If true, adds a removal policy of RemovalPolicy.RETAIN to the bucket
   * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html#autodeleteobjects
   * Despite the docs saying that the removal policy is required to be DESTROY, this will also
   * remove objects if the removal policy is RETAIN
   */
  retain?: boolean;
  scope: DotStack;
  /*
   * If true, enables static website hosting for the bucket. An `index.html` file must exist within the bucket contents.
   */
  staticHosting?: boolean;
  /* If true, turns on bucket versioning. This is required if using addBackup with the bucket */
  versioning?: boolean;
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
    /*
     * @desc Delete bucket objects when the stack is deleted or the bucket is
     * removed from the stack
     */
    autoDeleteObjects = true,
    cors = false,
    expireAfterDays,
    handlers,
    name,
    publicReadAccess,
    retain = false,
    staticHosting,
    scope,
    versioning = false
  } = options;

  if (autoDeleteObjects && retain)
    throw new AssertionError({
      message:
        'When retain is set to `true`, autoDeleteObjects cannot be set to `true`. Retained buckets should retain objects.'
    });

  const removalPolicy = retain
    ? RemovalPolicy.RETAIN
    : retain === false
    ? RemovalPolicy.DESTROY
    : autoDeleteObjects === true
    ? RemovalPolicy.DESTROY
    : void 0;
  const baseName = DotStack.baseName(name, 'bucket');
  const bucketName = scope.resourceName(baseName);
  const lifecycleRules: LifecycleRule[] = [];
  const websiteIndexDocument = staticHosting ? 'index.html' : void 0;
  const blockPublicAccess = publicReadAccess
    ? new BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      })
    : void 0;
  const corsProps = cors
    ? [
        {
          allowedHeaders: ['*'],
          allowedMethods: [HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT],
          allowedOrigins: ['*']
        }
      ]
    : void 0;

  log.info('Creating Bucket:', { baseName, bucketName, name });

  if (expireAfterDays && expireAfterDays > 0) {
    lifecycleRules.push({
      enabled: true,
      expiration: Duration.days(expireAfterDays),
      id: `${bucketName}-expiration-rule`
    });
  }

  const bucketProps: BucketProps = {
    autoDeleteObjects,
    blockPublicAccess,
    bucketName,
    cors: corsProps,
    lifecycleRules,
    publicReadAccess,
    removalPolicy,
    // Note: If this is ever used with a bucket that accepts overwriting existing objects,
    // then lifecycle rules need to be added. That's not something I've ever done so we're
    // leaving that alone for now
    versioned: versioning,
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

  const target = bucket || Bucket.fromBucketName(scope, `fromBucketName-${nanoid()}`, bucketName!);

  consumers.forEach((consumer) => {
    target.grantReadWrite(consumer);
  });
};
