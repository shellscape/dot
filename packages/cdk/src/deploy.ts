import 'source-map-support';
import '@dot/env';

import { join } from 'path';

import chalk from 'chalk';
import yargs from 'yargs-parser';

import { log } from './log';
import { addApp, App } from './methods';

const argv = yargs(process.argv.slice(2));
const { target }: { target: string } = argv as any;
const app = addApp();

export interface CdkDeployment {
  deploy: (app: App) => void;
}

(async () => {
  if (!target) {
    log.warn(chalk`{red No service argument provided. Nothing to deploy}`);
    return;
  }

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
