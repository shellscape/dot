import 'source-map-support';
import '@dot/env';

import { join } from 'path';

import chalk from 'chalk';
import yargs from 'yargs-parser';

import { log } from './log';
import { addApp, App } from './methods';

export interface CdkDeployment {
  deploy: (app: App) => void;
}

const argv = yargs(process.argv.slice(2));
const { target }: { target: string } = argv as any;
const { AWS_REGION, DEPLOY_ENV } = process.env;
const app = addApp();

if (!DEPLOY_ENV) {
  log.error(chalk`{bold DEPLOY_ENV is {red not set}. Please set DEPLOY_ENV before proceeding}`);
  process.exit(1);
}

(async () => {
  if (!target) {
    log.warn(chalk`{red No service argument provided. Nothing to deploy}`);
    return;
  }

  const region = AWS_REGION || app.region || 'default';

  log.info(chalk`{bold {dim DEPLOY_ENV = }{bold {magenta ${DEPLOY_ENV}}}}`);
  log.info(chalk`{bold {dim AWS Region: }{bold {magenta ${region}\n}}}`);

  log.info(chalk`{blue CDK Deploying:} ${target}`);

  try {
    const { deploy }: CdkDeployment = await import(join(target, 'cdk'));
    await deploy(app);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      log.error(chalk`{red Could not import cdk deploy from {reset ${target}}}`);
    }
    log.error(chalk.red('Deployment Error:'), error);
    process.exit(1);
  }
})();
