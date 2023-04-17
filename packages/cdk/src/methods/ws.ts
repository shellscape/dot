import { CfnAccount, CfnStage } from 'aws-cdk-lib/aws-apigateway';
import { WebSocketApi, WebSocketApiProps, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

import { DeployEnvironment, DotStack } from '../constructs/Stack';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function';
import { addParam } from './ssm';

interface AddWebsocketApiOptions extends AddNodeFunctionOptions {
  deployEnv?: DeployEnvironment;
  name?: string;
  routes?: string[];
}

export const addWebsocketApi = (options: AddWebsocketApiOptions) => {
  const { deployEnv = 'prod', name = '', routes = [], scope } = options;
  const baseName = DotStack.baseName(name, 'api');
  const apiName = scope.resourceName(baseName);

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
    stageName: deployEnv,
    webSocketApi: api
  });

  for (const route of routes) {
    api.addRoute(route, { integration });
  }

  stage.grantManagementApiAccess(handler);
  api.grantManageConnections(handler);
  // Note: This is necessary as of 2/22/22. The WebSocketApi construct is still considered experimental
  handler.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));

  const urlParam = addParam({
    id: `${apiName}-url-param`,
    name: `${scope.ssmPrefix}/url/${baseName}`,
    scope,
    value: stage.url
  });

  // eslint-disable-next-line no-new
  new CfnAccount(scope, 'Account', {
    // Note: This is a role that was created manually following this guide:
    // https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-cloudwatch-logs
    cloudWatchRoleArn: 'arn:aws:iam::389474096394:role/ApiGatewayCloudWatchRole'
  });

  // Note: The following log-related setup is necessary as of 2/22/22
  // eslint-disable-next-line no-new
  new LogGroup(scope, 'ExecutionLogs', {
    logGroupName: `/aws/apigateway/${api.apiId}/${scope.env}`,
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK
  });

  const log = new LogGroup(scope, 'AccessLogs', {
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK
  });

  const cfnStage = stage.node.defaultChild as CfnStage;
  cfnStage.accessLogSetting = {
    destinationArn: log.logGroupArn,
    format: `$context.identity.sourceIp - - [$context.requestTime] "$context.httpMethod $context.routeKey $context.protocol" $context.status $context.responseLength $context.requestId`
  };
  cfnStage.methodSettings = [
    {
      dataTraceEnabled: true,
      loggingLevel: 'INFO',
      throttlingBurstLimit: 500,
      throttlingRateLimit: 1000
    }
  ];

  return { api, handler, stage, urlParam };
};
