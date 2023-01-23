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

const log = getLog({ name: '/config' });
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

  const getBase = mem(
    async (key: string) => {
      log.debug('requesting value for key:', key);
      // We want this to be dynamic at call-time so we can massage process.env for testing, flexibility
      // eslint-disable-next-line  @typescript-eslint/no-shadow
      const env = config ?? (config = Object.assign({}, process.env));
      const envResult = typeof env[key] !== 'undefined' ? env[key] : void 0;
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
    },
    {
      cacheKey: (args) => JSON.stringify(args)
    }
  );

  /* eslint-disable no-redeclare */
  function get(
    key: keyof typeof defaults | keyof typeof secretKeys | keyof typeof ssmKeys
  ): Promise<string>;
  function get(key: string): Promise<string>;
  function get(key: any) {
    return (getBase as Function)(key as string);
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
