import {
  AccessLogFormat,
  CfnAccount,
  EndpointType,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway';
import { CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
import {
  DomainMappingOptions,
  DomainName,
  DomainNameProps,
  WebSocketApi,
  WebSocketApiProps,
  WebSocketStage
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { RemovalPolicy, Stack } from 'aws-cdk-lib/core';
import { Grant, IGrantable, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, LogRetention, RetentionDays } from 'aws-cdk-lib/aws-logs';

import { DeployEnvironment, DotStack } from '../constructs/Stack.js';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function.js';
import { addParam } from './ssm.js';

interface AddWebsocketApiOptions extends AddNodeFunctionOptions {
  deployEnv?: DeployEnvironment;
  domain?: ApiDomainOptions;
  name?: string;
  routes?: string[];
}

interface ApiDomainOptions {
  certificateArn: string;
  tld: string;
}

interface GrantRemoteWsOptions {
  apiArn: string;
  consumers: IGrantable[];
}

// Note: copied from https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-apigateway/lib/restapi.ts#L555
// since WebsocketApi is in alpha
const configureCloudWatchRole = (scope: DotStack, apiResource: WebSocketApi) => {
  const roleName = scope.resourceName('cloudwatch-role');
  const role = new Role(scope, 'CloudWatchRole', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
    ],
    roleName
  });
  role.applyRemovalPolicy(RemovalPolicy.DESTROY);
  scope.overrideId(role, roleName);

  const cloudWatchAccount = new CfnAccount(scope, scope.resourceName('cloudwatch-role-account'), {
    cloudWatchRoleArn: role.roleArn
  });
  cloudWatchAccount.applyRemovalPolicy(RemovalPolicy.DESTROY);
  cloudWatchAccount.node.addDependency(apiResource);

  return cloudWatchAccount;
};

export const addWebsocketApi = (options: AddWebsocketApiOptions) => {
  const { deployEnv = 'prod', domain, name = '', routes = [], scope } = options;
  const baseName = DotStack.baseName(name, 'api');
  const apiName = scope.resourceName(baseName);
  const domainOptions = domain
    ? ({
        certificate: Certificate.fromCertificateArn(
          scope,
          `${apiName}-cert`,
          domain.certificateArn
        ),
        domainName: domain.tld,
        endpointTypes: EndpointType.REGIONAL,
        securityPolicy: SecurityPolicy.TLS_1_2
      } as DomainNameProps)
    : void 0;
  let domainMapping: DomainMappingOptions | undefined;

  if (domainOptions) {
    domainMapping = {
      domainName: new DomainName(scope, `${apiName}-domain`, {
        ...domainOptions
      })
    };
  }

  const handler = addNodeFunction(options);
  const integration = new WebSocketLambdaIntegration(`${apiName}-int`, handler);

  const apiOptions: WebSocketApiProps = {
    apiName,
    connectRouteOptions: { integration },
    disconnectRouteOptions: { integration }
  };

  const api = new WebSocketApi(scope, apiName, apiOptions);
  const stage = new WebSocketStage(scope, `${apiName}-stage`, {
    autoDeploy: true,
    domainMapping,
    stageName: deployEnv,
    webSocketApi: api
  });

  // Note: this turns on cloudwatch logging for APIs
  stage.node.addDependency(configureCloudWatchRole(scope, api));

  // SAD: there's no way to configure the retention period AND removal for execution logs easily
  // eslint-disable-next-line no-new
  new LogRetention(scope, `${apiName}-log-retention`, {
    logGroupName: `API-Gateway-Execution-Logs_${api.apiId}/${deployEnv}`,
    retention: RetentionDays.ONE_WEEK
  });

  for (const route of routes) {
    api.addRoute(route, { integration });
  }

  stage.grantManagementApiAccess(handler);
  api.grantManageConnections(handler);
  // Note: This is necessary as of 2/22/22. The WebSocketApi construct is still considered experimental
  handler.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));

  const apiIdParam = addParam({
    id: `${apiName}-api-id-param`,
    name: `${scope.ssmPrefix}/api-id/${baseName}`,
    scope,
    value: api.apiId
  });

  const arn = Stack.of(api).formatArn({ resource: api.apiId, service: 'execute-api' });
  const arnParam = addParam({
    id: `${apiName}-arn-param`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: arn
  });

  const urlParam = addParam({
    id: `${apiName}-url-param`,
    name: `${scope.ssmPrefix}/url/${baseName}`,
    scope,
    value: stage.url
  });

  // Note: The following log-related setup is necessary as of 2/22/22
  // eslint-disable-next-line no-new
  const execLogs = new LogGroup(scope, 'ExecutionLogs', {
    logGroupName: `/aws/apigateway/${api.apiId}/${scope.env}`,
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK
  });

  const accessLogs = new LogGroup(scope, 'AccessLogs', {
    logGroupName: `${apiName}-access-logs`,
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK
  });

  execLogs.applyRemovalPolicy(RemovalPolicy.DESTROY);
  accessLogs.applyRemovalPolicy(RemovalPolicy.DESTROY);

  const cfnStage = stage.node.defaultChild as CfnStage;
  cfnStage.accessLogSettings = {
    destinationArn: accessLogs.logGroupArn,
    format: AccessLogFormat.jsonWithStandardFields().toString()
  };
  cfnStage.defaultRouteSettings = {
    dataTraceEnabled: true,
    loggingLevel: 'INFO',
    throttlingBurstLimit: 500,
    throttlingRateLimit: 1000
  };

  return { api, apiIdParam, arnParam, handler, stage, urlParam };
};

export const grantRemoteWs = ({ apiArn, consumers }: GrantRemoteWsOptions) => {
  consumers.forEach((consumer) => {
    // grantManageConnections
    Grant.addToPrincipal({
      actions: ['execute-api:ManageConnections'],
      grantee: consumer,
      resourceArns: [`${apiArn}/*/*/@connections/*`]
    });
  });
};
