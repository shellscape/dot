import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import SecretsManager from 'aws-sdk/clients/secretsmanager';

import { DotStack } from '../constructs/Stack';

interface AddSecretOptions {
  consumers?: IGrantable[];
  name: string;
  scope: DotStack;
  secretName: string;
}

interface GrantRemoteOptions {
  consumers: IGrantable[];
  scope: DotStack;
  secretName: string;
}

type SecretArn = string;

export const addSecret = ({ consumers = [], name, scope, secretName }: AddSecretOptions) => {
  const baseName = DotStack.baseName(name, 'secret');
  const logicalName = `${scope.appName}-${baseName}`;
  const secret = new Secret(scope, logicalName, { secretName });

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
  const sm = new SecretsManager({ region: 'us-east-1' });

  const response = await sm
    .listSecrets({ Filters: [{ Key: 'name', Values: [name] }], MaxResults: 1 })
    .promise();
  return (response.SecretList?.length ?? 0) > 0;
};
