import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { getLog } from '@dot/log';

const log = getLog({ brand: '@dot', name: '\u001b[1D/config' });

export const getSecretValue = async (secretId: string) => {
  if (!secretId) {
    log.debug('No secret ID requested, returning');
    return void 0;
  }

  log.debug('Secret requested:', secretId);

  try {
    const client = new SecretsManagerClient({});
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const secret = await client.send(command);

    const result = secret.SecretString;

    if (result) log.debug('Secret Found:', result.replace(/.(?=.{4})/g, '*'));
    else log.debug('Secret Not Found');

    return result;
  } catch (error) {
    log.error('Secrets Error:', error);
    return void 0;
  }
};

export const getSsmValue = async (path: string) => {
  if (!path) {
    log.debug('No parameter path requested, returning');
    return void 0;
  }

  log.debug('Parameter requested:', path);

  try {
    const client = new SSMClient({});
    const command = new GetParameterCommand({ Name: path });
    const { Parameter: result } = await client.send(command);

    if (result) log.debug('Parameter Found:', result.Value?.replace(/.(?=.{4})/g, '*'));
    else log.debug('Parameter Not Found');

    return result!.Value;
  } catch (error) {
    log.error('SSM Error:', error);
    return void 0;
  }
};

export const putSsmValue = async (path: string, value: string) => {
  if (!path) return void 0;

  const client = new SSMClient({});
  const command = new PutParameterCommand({ Name: path, Overwrite: true, Value: String(value) });
  const result = await client.send(command);

  return result.$metadata;
};
