import {
  DeliveryStream,
  DeliveryStreamProps,
  IDestination
} from '@aws-cdk/aws-kinesisfirehose-alpha';
import { S3Bucket } from '@aws-cdk/aws-kinesisfirehose-destinations-alpha';
import { Effect, IGrantable, Role, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Stream, StreamEncryption, StreamProps } from 'aws-cdk-lib/aws-kinesis';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';

import { DotStack } from '../constructs/Stack';

import { addKey } from './kms';
import { addBucket, AddBucketOptions } from './s3';
import { addParam } from './ssm';

interface AddStreamOptions {
  encryption?: Boolean | Key;
  name: string;
  retentionPeriod?: Duration;
  scope: DotStack;
  shardCount?: number;
}

interface AddStreamResult {
  key?: Key;
  stream: Stream;
}

interface AddFirehoseOptions {
  destinationBucket?: Bucket | Omit<AddBucketOptions, 'name' | 'scope'>;
  // conversion?: DataFormatConversion;
  destinations?: IDestination[];
  name: string;
  scope: DotStack;
  source: Stream | Omit<AddStreamOptions, 'name' | 'scope'>;
}

interface AddFirehoseResult {
  bucket?: Bucket;
  deliveryStream: DeliveryStream;
  sourceStream: Stream;
}

interface GrantRemoteStreamOptions {
  consumers: IGrantable[];
  scope: DotStack;
  streamArn: string;
  streamName: string;
}

export const addFirehose = (options: AddFirehoseOptions): AddFirehoseResult => {
  const { /* conversion,*/ destinations, destinationBucket, name, scope, source } = options;
  const baseName = DotStack.baseName(name, 'firehose');
  const firehoseName = scope.resourceName(baseName);
  const sourceStream =
    source instanceof Stream
      ? source
      : addStream({ name: `${name}-stream`, scope, ...source }).stream;
  const deliveryProps: DeliveryStreamProps = {
    deliveryStreamName: firehoseName,
    destinations: [],
    sourceStream
  };
  let bucket: Bucket | undefined;

  if (destinations) deliveryProps.destinations.push(...destinations);
  if (destinationBucket) {
    bucket =
      destinationBucket instanceof Bucket
        ? destinationBucket
        : addBucket({ name: `${baseName}-bucket`, scope, ...destinationBucket }).bucket;

    const role = new Role(scope, `${firehoseName}-dest-role`, {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com')
    });

    role.addToPolicy(
      new PolicyStatement({
        actions: [
          'kinesis:DescribeStream',
          'kinesis:GetShardIterator',
          'kinesis:GetRecords',
          'kinesis:ListShards'
        ],
        effect: Effect.ALLOW,
        resources: [sourceStream.streamArn]
      })
    );

    role.addToPolicy(
      new PolicyStatement({
        actions: [
          's3:AbortMultipartUpload',
          's3:GetBucketLocation',
          's3:GetObject',
          's3:ListBucket',
          's3:ListBucketMultipartUploads',
          's3:PutObject'
        ],
        effect: Effect.ALLOW,
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`]
      })
    );

    role.addToPolicy(
      new PolicyStatement({
        actions: ['glue:GetTable', 'glue:GetTableVersion', 'glue:GetTableVersions'],
        effect: Effect.ALLOW,
        resources: ['*']
      })
    );

    const s3Destintation = new S3Bucket(bucket, { /* conversion,*/ role });
    // (s3Destintation as any).errorOutputPrefix = errorOutputPrefix;
    // (s3Destintation as any).prefix = prefix;
    deliveryProps.destinations.push(s3Destintation);
    (deliveryProps as any).role = role;
  }

  const deliveryStream = new DeliveryStream(scope, firehoseName, deliveryProps);

  addParam({
    id: `${firehoseName}-arn-param`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: deliveryStream.deliveryStreamArn
  });

  scope.overrideId(deliveryStream, firehoseName);

  return { bucket, deliveryStream, sourceStream };
};

export const addStream = (options: AddStreamOptions): AddStreamResult => {
  const { encryption, name, retentionPeriod = Duration.hours(24), scope, shardCount = 3 } = options;
  const baseName = DotStack.baseName(name, 'stream');
  const streamName = scope.resourceName(baseName);
  const streamProps: StreamProps = { retentionPeriod, shardCount, streamName };
  let key: Key | undefined;

  if ((encryption as any) instanceof Key === false) key = addKey({ name: baseName, scope });

  if (typeof encryption === 'boolean') {
    (streamProps as any).encryption = StreamEncryption.KMS;
    (streamProps as any).encryptionKey = key;
  }

  const stream = new Stream(scope, streamName, streamProps);

  addParam({
    id: `${streamName}-arn-param`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: stream.streamArn
  });

  scope.overrideId(stream, streamName);

  return { key, stream };
};

export const grantRemoteStream = ({
  consumers,
  scope,
  streamArn,
  streamName
}: GrantRemoteStreamOptions) => {
  const stream = Stream.fromStreamArn(scope, `${streamName}-grantRemoteStream`, streamArn);

  consumers.forEach((resource) => stream.grantWrite(resource));
};
