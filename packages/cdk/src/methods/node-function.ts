import { Size, Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  BundlingOptions,
  ICommandHooks,
  NodejsFunction,
  SourceMapMode
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import chalk from 'chalk';

// FIXME: reconcile this file with function.ts

import { DotStack } from '../constructs/Stack';
import { log } from '../log';

import { setupFunction, AddFunctionOptions } from './function';

export interface AddNodeFunctionOptions extends Omit<AddFunctionOptions, 'handlerPath'> {
  /**
   * Commands to run before bundling and before the lambda archive is finalized
   */
  entryFilePath?: string;
  esbuild?: BundlingOptions;
  handlerExportName?: string;
  hooks?: Partial<ICommandHooks>;
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
    runtime: Runtime.NODEJS_18_X,
    timeout,
    tracing: Tracing.ACTIVE
  });

  return setupFunction({ fnName, handler, options });
};
