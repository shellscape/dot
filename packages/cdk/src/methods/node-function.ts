import { Size, Duration } from 'aws-cdk-lib';
import { Alias, Function, LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  BundlingOptions,
  ICommandHooks,
  NodejsFunction,
  SourceMapMode
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import chalk from 'chalk';

import { DotStack } from '../constructs/Stack.js';
import { log } from '../log.js';

import { addFunctionAlarms, type AddFunctionOptions } from './function.js';

export { Runtime };

export interface AddNodeFunctionOptions extends Omit<AddFunctionOptions, 'handlerPath'> {
  /**
   * Commands to run before bundling and before the lambda archive is finalized
   */
  entryFilePath?: string;
  esbuild?: BundlingOptions;
  handlerExportName?: string;
  hooks?: Partial<ICommandHooks>;
  runtime?: Runtime;
}

interface SetupFunctionArgs {
  fnName: string;
  handler: Function;
  options: AddFunctionOptions;
}

export const addNodeFunction = (options: AddNodeFunctionOptions) => {
  const {
    concurrency,
    deadLetterQueue,
    entryFilePath = 'dist/lambda.ts',
    environmentVariables = {},
    esbuild = {},
    handlerExportName = 'handler',
    hooks,
    memorySize = 2000,
    name = '',
    runtime = Runtime.NODEJS_22_X,
    scope,
    storageMb,
    timeout = Duration.minutes(5)
  } = options;
  const { env } = scope;

  const baseName = DotStack.baseName(name, 'fn');
  const baseHooks: ICommandHooks = {
    afterBundling: () => [],
    beforeBundling: () => [],
    beforeInstall: () => []
  };
  const bundleOptions: BundlingOptions = {
    ...esbuild,
    commandHooks: hooks ? { ...baseHooks, ...hooks } : void 0,
    externalModules: [...(esbuild.externalModules || []), ...['pg-native']]
  };
  const fnName = scope.resourceName(baseName);
  const defaultEnv: typeof environmentVariables = {
    // Note: https://acloudguru.com/blog/engineering/building-more-cost-effective-lambda-functions-with-1-ms-billing
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    DEPLOY_ENV: env,
    IS_LAMBDA: 'true',
    NODE_ENV: env,
    NODE_OPTIONS: `--enable-source-maps --max-old-space-size=${memorySize}`
  };

  log.info('Creating function:', chalk.dim(fnName));
  log.info('From:', chalk.dim(entryFilePath));
  log.info('Targeting:', chalk.dim(handlerExportName));

  const handler = new NodejsFunction(scope, fnName, {
    bundling: {
      minify: true,
      ...bundleOptions,
      sourceMap: true,
      sourceMapMode: SourceMapMode.INLINE,
      sourcesContent: false
    },
    deadLetterQueueEnabled: deadLetterQueue,
    entry: entryFilePath,
    environment: { ...defaultEnv, ...environmentVariables },
    ephemeralStorageSize: storageMb ? Size.mebibytes(storageMb) : void 0,
    functionName: fnName,
    handler: handlerExportName,
    logRetention: RetentionDays.ONE_WEEK,
    memorySize,
    reservedConcurrentExecutions: concurrency?.reserved,
    runtime,
    timeout,
    tracing: Tracing.ACTIVE
  });

  return setupFunction({ fnName, handler, options });
};

const setupFunction = ({ fnName, handler, options }: SetupFunctionArgs) => {
  const {
    addEnvars,
    alarmEmail,
    concurrency,
    environmentVariables = {},
    layers,
    layerArns,
    scope
  } = options;

  if (concurrency?.provisioned) {
    log.info(' - Provisioning Concurrency for:', chalk.dim(fnName));

    if (concurrency?.provisioned?.max <= 0)
      throw new RangeError(`concurrency.provisioned.max needs to be greater than 0`);

    const aliasName = `${fnName}-alias`;
    const alias = new Alias(scope, aliasName, { aliasName, version: handler.latestVersion });
    const scaling = alias.addAutoScaling({
      maxCapacity: Math.ceil(concurrency.provisioned.max),
      minCapacity: Math.ceil(concurrency.provisioned.min || 1)
    });

    scaling.scaleOnUtilization({ utilizationTarget: concurrency.provisioned.percentage || 0.5 });
  }
  // TODO: Add schedule based provisioning
  // https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html#autoscaling

  if (layerArns?.length) {
    const layerVersion = layerArns.map((arn, index) =>
      LayerVersion.fromLayerVersionArn(scope, `${handler.functionName}-layer-${index}`, arn)
    );
    handler.addLayers(...layerVersion);
  }

  if (layers?.length) handler.addLayers(...layers);

  scope.overrideId(handler, fnName);

  addEnvars
    // we don't want to override envars that we've already specified
    ?.filter((varName) => !environmentVariables[varName])
    .forEach((varName) => {
      const value = process.env[varName];
      // eslint-disable-next-line no-unused-expressions
      value && handler.addEnvironment(varName, value);
    });

  if (alarmEmail)
    addFunctionAlarms(alarmEmail, handler, fnName.replace(`${scope.env}-`, ''), scope);

  return handler;
};
