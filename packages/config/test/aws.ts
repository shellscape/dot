/* eslint-disable no-undefined */

import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import test from 'ava';
import { mockClient } from 'aws-sdk-client-mock';

const secretsMock = mockClient(SecretsManagerClient);
const ssmMock = mockClient(SSMClient);

secretsMock.on(GetSecretValueCommand).callsFake((input) => {
  if (input.SecretId === 'joker') throw new Error('joker');
  return { SecretString: 'batman' };
});

ssmMock.on(GetParameterCommand).callsFake((input) => {
  if (input.Name === 'joker') throw new Error('joker');
  return { Parameter: { Value: 'batman' } };
});

test('getSecretValue', async (t) => {
  const { getSecretValue } = await import('../dist/aws');

  let result = await getSecretValue('bruce');
  t.is(result, 'batman');

  result = await getSecretValue('joker');
  t.is(result, undefined);
});

test('getSsmValue', async (t) => {
  const { getSsmValue } = await import('../dist/aws');

  let result = await getSsmValue('batman');
  t.is(result, 'batman');

  result = await getSsmValue('joker');
  t.is(result, undefined);
});
