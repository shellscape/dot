import { getLog } from '@dot/log';
import { SSM, SecretsManager } from 'aws-sdk';

const { DOT_AWS_REGION: region } = process.env;

const log = getLog({ brand: '@dot', name: '\u001b[1D/config' });
const ssm = new SSM({ region });
const secrets = new SecretsManager({ region });

export const getSecretValue = async (secretId: string) => {
  if (!secretId) {
    log.debug('No secret ID requested, returning');
    return void 0;
  }

  log.debug('Secret requested:', secretId);

  try {
    const secret: SecretsManager.GetSecretValueResponse = await secrets
      .getSecretValue({ SecretId: secretId })
      .promise();
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

  // If / when we need to read encrypted keys, we'll need WithDecryption
  const params = { Name: path };

  try {
    const { Parameter: result } = await ssm.getParameter(params).promise();

    if (result) log.debug('Parameter Found:', result.Value?.replace(/.(?=.{4})/g, '*'));
    else log.debug('Parameter Not Found');

    return result?.Value;
  } catch (error) {
    log.error('SSM Error:', error);
    return void 0;
  }
};

export const putSsmValue = async (path: string, value: string) => {
  if (!path) return void 0;

  const result = await ssm
    .putParameter({ Name: path, Overwrite: true, Value: String(value) })
    .promise();

  return result.$response;
};
