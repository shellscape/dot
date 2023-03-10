import { App, CfnResource, Resource, Stack, StackProps } from 'aws-cdk-lib';
import camelcase from 'camelcase';
import chalk from 'chalk';

import { log } from '../log';

export type DeployEnvironment = 'dev' | 'prod' | 'stage' | 'test';

export interface DotStackProps extends StackProps {
  appName?: string;
  name: string;
}

const { DEPLOY_ENV } = process.env;

export class DotStack extends Stack {
  public readonly app: App;
  public readonly appName: string;
  public readonly env: DeployEnvironment;
  public readonly envPrefix: string;
  public readonly ssmPrefix: string;

  constructor(scope: App, props: DotStackProps) {
    const stackName = props.name.replace(/-stack$/, '');
    const env = DEPLOY_ENV as DeployEnvironment;
    const envPrefix = `${env}-`;
    const stackEnv = { ...(props.env || {}) };

    super(scope, `${envPrefix}${stackName}-stack`, { ...props, env: stackEnv });

    this.app = scope;
    this.appName = envPrefix + (props.appName || props.name);
    this.env = env;
    this.envPrefix = envPrefix;
    this.node.setContext('appName', this.appName);
    this.node.setContext('env', this.env);
    this.ssmPrefix = `/${env}/${props.appName || props.name}`;
  }

  static baseName(input: string, suffix: string) {
    const name = input === suffix ? 'default' : input;
    return name.replace(new RegExp(`(-?)${suffix}$`), '').concat('-', suffix);
  }

  public overrideId(thing: Resource, id: string) {
    const prefix = id.startsWith(this.appName) ? '' : `${this.appName}-`;
    const result = camelcase(`${prefix}${id}`);
    log.info('Overriding Logical ID:', chalk.dim(result));
    (thing.node.defaultChild as CfnResource).overrideLogicalId(result);
  }

  public resourceName(baseName: string) {
    return `${this.appName}-${baseName}`.split('-').filter(Boolean).join('-');
  }
}
