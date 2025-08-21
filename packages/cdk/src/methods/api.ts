import {
  AccessLogFormat,
  Cors,
  DomainNameOptions,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  MethodOptions,
  RestApi,
  RestApiProps,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, LogRetention, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

import { DotStack } from '../constructs/Stack.js';

import { AddAuthorizerOptions, addAuthorizer } from './authorizer.js';
import { addNodeFunction, AddNodeFunctionOptions } from './node-function.js';
import { addOutput } from './output.js';
import { addParam } from './ssm.js';

interface ApiDomainOptions {
  certificateArn: string;
  tld: string;
}

type ApiVerb = 'DELETE' | 'GET' | 'POST' | 'PUT' | 'OPTIONS';

interface AddApiOptions {
  authorization?: Omit<AddAuthorizerOptions, 'scope'>;
  binaryMedia?: boolean | string[];
  cors?: boolean;
  deployEnv?: 'prod' | 'stage' | 'dev' | 'test';
  domain?: ApiDomainOptions;
  handler: Omit<AddNodeFunctionOptions, 'scope'> | Function;
  name?: string;
  paths?: string[];
  proxy?: boolean;
  scope: DotStack;
  verbs?: ApiVerb[];
}

export interface AddApiResult {
  api: RestApi;
  handler: Function;
}

const binaryMediaDefaults = [
  'application/octet-stream',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'image/jpg',
  'image/jpeg',
  'image/png'
];

export const addApi = (options: AddApiOptions): AddApiResult => {
  const {
    authorization,
    binaryMedia = false,
    cors,
    deployEnv = 'prod',
    domain,
    name = '',
    paths = ['{all}'],
    proxy,
    scope,
    verbs = ['DELETE', 'GET', 'POST', 'PUT', 'OPTIONS']
  } = options;
  const baseName = DotStack.baseName(name, 'api');
  const apiName = scope.resourceName(baseName);

  const domainName = domain
    ? ({
        certificate: Certificate.fromCertificateArn(
          scope,
          `${apiName}-cert`,
          domain.certificateArn
        ),
        domainName: domain.tld,
        endpointTypes: EndpointType.REGIONAL,
        securityPolicy: SecurityPolicy.TLS_1_2
      } as DomainNameOptions)
    : void 0;

  const logGroupName = `${apiName}-access-logs`;
  const accessLogGroup = new LogGroup(scope, logGroupName, {
    logGroupName,
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK
  });

  const apiOptions: RestApiProps = {
    binaryMediaTypes: binaryMedia === true ? binaryMediaDefaults : void 0,
    defaultCorsPreflightOptions: cors
      ? {
          allowHeaders: ['Cache-Control', ...Cors.DEFAULT_HEADERS],
          allowMethods: verbs,
          allowOrigins: Cors.ALL_ORIGINS
        }
      : void 0,
    deployOptions: {
      accessLogDestination: new LogGroupLogDestination(accessLogGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      dataTraceEnabled: true,
      loggingLevel: MethodLoggingLevel.INFO,
      stageName: deployEnv
    },
    domainName,
    endpointExportName: apiName,
    endpointTypes: [EndpointType.REGIONAL],
    restApiName: apiName
  };
  const api = new RestApi(scope, apiName, apiOptions);

  // SAD: there's no way to configure the retention period AND removal for execution logs easily
  // eslint-disable-next-line no-new
  new LogRetention(scope, `${apiName}-log-retention`, {
    logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${deployEnv}`,
    retention: RetentionDays.ONE_WEEK
  });

  const handler =
    options.handler instanceof Function
      ? options.handler
      : addNodeFunction(Object.assign({ name: baseName }, options.handler as any, { scope }));

  const integration = new LambdaIntegration(handler);
  let methodOptions: MethodOptions = {};

  if (authorization) {
    const { authorizer } = addAuthorizer({ scope, ...authorization });
    methodOptions = { authorizer };
  }

  const addMethods = (what: any) =>
    verbs.forEach((method) => what.addMethod(method, integration, methodOptions));

  if (proxy) {
    const apiProxy = api.root.addProxy();
    addMethods(apiProxy);
  } else {
    addMethods(api.root);
    paths.forEach((path) => {
      const resource = api.root.addResource(path);
      addMethods(resource);
    });
  }

  addParam({
    id: `${apiName}-url-param`,
    name: `${scope.ssmPrefix}/url/${baseName}`,
    scope,
    value: api.url
  });

  addParam({
    id: `${apiName}-arn-param`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: api.arnForExecuteApi('ANY')
  });

  if (domain) {
    addOutput({
      name: `${apiName}-domain-output`,
      scope,
      value: api.domainName?.domainNameAliasDomainName
    });
    addParam({
      id: `${apiName}-domain-param`,
      name: `${scope.ssmPrefix}/domain/${baseName}`,
      scope,
      value: api.domainName?.domainNameAliasDomainName
    });
  }

  return { api, handler };
};
