import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  Distribution,
  ErrorResponse,
  OriginAccessIdentity,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';

import { DotStack } from '../constructs/Stack';

import { addBucket } from './s3';

interface BaseDistOptions {
  certificateArn: string;
  domainNames?: string[];
  name: string;
  scope: DotStack;
}

interface AddS3DistOptions extends BaseDistOptions {
  bucket: Bucket;
  redirectErrorsTo?: string;
}

const getLogBucket = (name: string, scope: DotStack) => {
  const { bucket } = addBucket({ expireAfterDays: 10, name: `${name}-log`, scope });
  bucket.applyRemovalPolicy(RemovalPolicy.DESTROY);
  return bucket;
};

export const addS3Distribution = ({
  bucket,
  certificateArn,
  domainNames,
  name,
  redirectErrorsTo,
  scope
}: AddS3DistOptions) => {
  const baseName = DotStack.baseName(name, 'dist');
  const distName = scope.resourceName(baseName);
  const certificate = Certificate.fromCertificateArn(scope, `${distName}-cert`, certificateArn);
  const logBucket = getLogBucket(baseName, scope);
  const originAccessIdentity = new OriginAccessIdentity(scope, `${distName}-origin-access`);
  let errorResponses: ErrorResponse[] | undefined = void 0;

  if (redirectErrorsTo) {
    errorResponses = [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: redirectErrorsTo,
        ttl: Duration.seconds(0)
      }
    ];
  }

  bucket.grantRead(originAccessIdentity);

  const dist = new Distribution(scope, distName, {
    certificate,
    defaultBehavior: {
      origin: new S3Origin(bucket, { originAccessIdentity }),
      viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY
    },
    defaultRootObject: 'index.html',
    domainNames,
    enableLogging: true,
    errorResponses,
    logBucket
  });

  scope.overrideId(dist, distName);

  return { dist };
};
