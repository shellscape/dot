import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';

import { DotStack } from '../constructs/Stack';

import { addParam } from './ssm';

export interface AddKeyOptions {
  name: string;
  scope: DotStack;
}

export const addKey = ({ name, scope }: AddKeyOptions) => {
  const baseName = DotStack.baseName(name, 'key');
  const keyName = scope.resourceName(baseName);
  const key = new Key(scope, keyName);

  scope.overrideId(key, keyName);

  key.addToResourcePolicy(
    new PolicyStatement({
      actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
      effect: Effect.ALLOW,
      principals: [new ServicePrincipal('sns')],
      sid: 'sns-allow'
    })
  );

  addParam({
    id: `${keyName}-arn`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: key.keyArn
  });

  return key;
};
