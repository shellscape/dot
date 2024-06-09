import { SecretsManagerClient, ListSecretsCommand } from '@aws-sdk/client-secrets-manager';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { SecretValue } from 'aws-cdk-lib';

import { DotStack } from '../constructs/Stack';

interface AddSecretOptions {
  consumers?: IGrantable[];
  /** WARNING: It's advised not to use this unless the use case specifically calls for creating the secret value programattically */
  jsonValue?: Record<string, SecretValue>;
  name: string;
  scope: DotStack;
  secretName: string;
  /** WARNING: It's advised not to use this unless the use case specifically calls for creating the secret value programattically */
  value?: SecretValue;
}

interface GrantRemoteOptions {
  consumers: IGrantable[];
  scope: DotStack;
  secretName: string;
}

type SecretArn = string;

export const addSecret = (options: AddSecretOptions) => {
  const { consumers = [], jsonValue, name, scope, secretName, value } = options;
  const baseName = DotStack.baseName(name, 'secret');
  const logicalName = `${scope.appName}-${baseName}`;
  const secretObjectValue = jsonValue;
  const secretStringValue = value;
  const secret = new Secret(scope, logicalName, {
    secretName,
    secretObjectValue,
    secretStringValue
  });

  scope.overrideId(secret, logicalName);
  consumers.forEach((resource) => secret.grantRead(resource));

  return { secret };
};

export const grantRemoteSecret = ({
  consumers,
  secretName,
  scope
}: GrantRemoteOptions): SecretArn => {
  const secret = Secret.fromSecretNameV2(scope, `${secretName}-grantRemote`, secretName);

  consumers.forEach((resource) => secret.grantRead(resource));

  return secret.secretArn;
};

export const secretExists = async (name: string): Promise<boolean> => {
  const client = new SecretsManagerClient({ region: DotStack.awsRegion });
  const command = new ListSecretsCommand({
    Filters: [{ Key: 'name', Values: [name] }],
    MaxResults: 1
  });
  const response = await client.send(command);

  return (response.SecretList?.length ?? 0) > 0;
};
