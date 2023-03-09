import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { InterfaceVpcEndpointAwsService, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { ContainerImage, LogDriver, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

import type { MinMaxNumber } from '../types';

import { DotStack } from '../constructs/Stack';

import { addBucket } from './s3';
import { addSecurityGroup } from './security';

export enum ServiceCPUUnits {
  FOUR_VCPU = 4096,
  HALF_VCPU = 512,
  ONE_VCPU = 1024,
  TWO_VCPU = 2048
}

export enum ServiceMemoryLimit {
  FOUR_GB = 4096,
  HALF_GB = 512,
  ONE_GB = 1024,
  TWO_GB = 2048
}

interface AddServiceOptions {
  baseDir: string;
  certificateArn: string;
  cpu?: ServiceCPUUnits;
  cpuScaleAtPercent: MinMaxNumber<10, 90>;
  desiredInstances?: MinMaxNumber<1, 10>;
  environmentVariables: Record<string, string>;
  maxInstances?: MinMaxNumber<1, 10>;
  memory?: ServiceMemoryLimit;
  minInstances?: MinMaxNumber<1, 10>;
  name?: string;
  nodeMemorySize?: number;
  scope: DotStack;
}

export interface AddServiceResult {
  task: FargateTaskDefinition;
}

export const addFargateService = (options: AddServiceOptions): AddServiceResult => {
  const {
    baseDir,
    certificateArn,
    cpu = ServiceCPUUnits.HALF_VCPU,
    cpuScaleAtPercent = 50,
    desiredInstances = 1,
    environmentVariables,
    maxInstances = 3,
    memory = ServiceMemoryLimit.HALF_GB,
    minInstances = 1,
    name = '',
    nodeMemorySize = 2000,
    scope
  } = options;
  const { env } = scope;
  const baseName = DotStack.baseName(name, 'service');
  const serviceName = scope.resourceName(baseName);
  const certificate = Certificate.fromCertificateArn(scope, `${serviceName}-cert`, certificateArn);

  const asset = new DockerImageAsset(scope, `${serviceName}-asset`, {
    directory: baseDir
  });

  const { cluster, loadBalancer, service, targetGroup, taskDefinition } =
    new ecsPatterns.ApplicationLoadBalancedFargateService(scope, serviceName, {
      assignPublicIp: true,
      certificate,
      cpu,
      desiredCount: desiredInstances,
      loadBalancerName: `${serviceName}-lb`,
      memoryLimitMiB: memory,
      protocol: ApplicationProtocol.HTTPS,
      publicLoadBalancer: true,
      serviceName,
      taskImageOptions: {
        containerPort: 80,
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          DEPLOY_ENV: env,
          DOT_AWS_REGION: 'us-east-1',
          IS_FARGATE: 'true',
          NODE_ENV: env,
          NODE_OPTIONS: `--enable-source-maps --max-old-space-size=${nodeMemorySize}`,
          ...environmentVariables
        },
        image: ContainerImage.fromDockerImageAsset(asset),
        logDriver: LogDriver.awsLogs({
          logRetention: RetentionDays.ONE_WEEK,
          streamPrefix: serviceName
        })
      }
    });

  scope.overrideId(service, serviceName);

  const { bucket } = addBucket({
    autoDelete: true,
    expireAfterDays: 7,
    name: 'service-lb-logs',
    scope
  });
  loadBalancer.logAccessLogs(bucket);

  targetGroup.configureHealthCheck({
    healthyThresholdCount: 2,
    path: '/healthz'
  });

  targetGroup.setAttribute('deregistration_delay.timeout_seconds', '10');

  const scaling = service.autoScaleTaskCount({
    maxCapacity: maxInstances,
    minCapacity: minInstances
  });

  scaling.scaleOnCpuUtilization(`${serviceName}-scaling`, {
    targetUtilizationPercent: cpuScaleAtPercent
  });

  const { vpc } = cluster;

  // Note: The security group here was the key to getting CF to stop hanging on adding the interfaces
  // below. If we don't include a security group, they _each_ create their own, and that really
  // confuses CF. We also can't get the list of securityGroupIds or the securityGroup references that
  // CDK creats for us because they're private to the FargateService class, and if we try to pull them
  // from the LoadBalancer, we get an error about our Stack and needing to hardcode the accountId
  const securityGroup = addSecurityGroup({
    allowAllOutbound: true,
    egressRules: [{ connection: Port.tcp(443), peer: Peer.ipv4(vpc.vpcCidrBlock) }],
    id: `${serviceName}-sg`,
    scope,
    vpc
  });
  const securityGroups = [securityGroup];

  // Note: We're going to add the most common interfaces we use, in prep for services to assign
  // permissions

  vpc.addInterfaceEndpoint(`${serviceName}-secrets-iface`, {
    securityGroups,
    service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER
  });

  vpc.addInterfaceEndpoint(`${serviceName}-sns-iface`, {
    securityGroups,
    service: InterfaceVpcEndpointAwsService.SNS
  });

  vpc.addInterfaceEndpoint(`${serviceName}-sqs-iface`, {
    securityGroups,
    service: InterfaceVpcEndpointAwsService.SQS
  });

  vpc.addInterfaceEndpoint(`${serviceName}-ssm-iface`, {
    securityGroups,
    service: InterfaceVpcEndpointAwsService.SSM
  });

  return {
    task: taskDefinition
  };
};
