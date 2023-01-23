/* eslint-disable no-undefined */

import test from 'ava';
import AWS from 'aws-sdk';
import { mock, setSDKInstance } from 'aws-sdk-mock';

setSDKInstance(AWS);

mock(
  'SecretsManager',
  'getSecretValue',
  (key: AWS.SecretsManager.GetSecretValueRequest, callback: Function) => {
    const [error, result] =
      key.SecretId === 'joker' ? [new Error('joker'), null] : [null, { SecretString: 'batman' }];
    callback(error, result);
  }
);

mock('SSM', 'getParameter', (key: AWS.SSM.GetParameterRequest, callback: Function) => {
  const [error, result] =
    key.Name === 'joker' ? [new Error('joker'), null] : [null, { Parameter: { Value: 'batman' } }];
  callback(error, result);
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
