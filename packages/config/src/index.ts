import { getLog } from '@dot/log';
import mem from 'mem';

import { getSecretValue, getSsmValue, putSsmValue } from './aws';

export interface ConfigInitParams<TDefaults, TSecrets, TSsm> {
  defaultConfig: TDefaults;
  secretConfig: TSecrets;
  ssmConfig: TSsm;
}

export interface KeyConfig {
  [key: string]: string;
}

export enum DotEnv {
  DEV = 'dev',
  PROD = 'prod',
  STAGE = 'stage',
  TEST = 'test'
}

const log = getLog({ brand: '@dot', name: '\u001b[1D/config' });
const { DEPLOY_ENV, NODE_ENV } = process.env;
const deployEnv = DEPLOY_ENV || NODE_ENV;

export const env = (deployEnv === 'production' ? 'prod' : deployEnv) as DotEnv;
export const envPrefix = `${env}-`;

export const init = <TDefaults, TSecrets, TSsm>({
  defaultConfig,
  secretConfig,
  ssmConfig
}: ConfigInitParams<TDefaults, TSecrets, TSsm>) => {
  let config: { [key: string]: unknown } | null = null;
  const defaults: TDefaults = Object.assign({ NODE_ENV: 'unknown' }, defaultConfig);
  const secretKeys: TSecrets = Object.assign({}, secretConfig);
  const ssmKeys: TSsm = Object.assign({}, ssmConfig);

  const getBase = async (key: string) => {
    log.debug('requesting value for key:', key);

    if (!config || process.env.DOT_CONFIG_DISABLE_CACHE) {
      config = { ...process.env };
    }

    const envResult = typeof config[key] !== 'undefined' ? config[key] : void 0;

    log.debug('envResult for:', key, '→', envResult);

    const result =
      envResult ||
      (await getSsmValue((ssmKeys as KeyConfig)[key])) ||
      (await getSecretValue((secretKeys as KeyConfig)[key])) ||
      (defaults as KeyConfig)[key];

    if (result === void 0)
      throw new RangeError(
        `The environment, secret, or ssm variable '${key}' is unpopulated or invalid`
      );

    return result;
  };

  /* eslint-disable no-redeclare */
  function get(
    key: keyof typeof defaults | keyof typeof secretKeys | keyof typeof ssmKeys
  ): Promise<string>;
  function get(key: string): Promise<string>;
  function get(key: any) {
    log.debug('process.env.DOT_CONFIG_DISABLE_CACHE', process.env.DOT_CONFIG_DISABLE_CACHE);

    if (process.env.DOT_CONFIG_DISABLE_CACHE) return getBase(key);

    const fn = mem(getBase, { cacheKey: (args) => JSON.stringify(args) });
    return fn(key);
  }

  const put = (key: keyof typeof ssmKeys, value: string) => {
    if (!ssmKeys[key]) {
      throw new RangeError(`The ssm variable '${key as string}' is unpopulated or invalid`);
    }

    return putSsmValue((ssmKeys as KeyConfig)[key as string], value);
  };

  return {
    get,
    put
  };
};
