import { generateKeyPairSync } from 'crypto';

import { PublicKey } from 'aws-cdk-lib/aws-cloudfront';

import { type DotStack } from '../constructs/Stack';

import { addSecret } from './secret';
import { addParam, getParamValue } from './ssm';

const generateRsaKeyPair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {
      format: 'pem',
      type: 'pkcs8'
    },
    publicKeyEncoding: {
      format: 'pem',
      type: 'spki'
    }
  });
  return { privateKey, publicKey };
};

export const addSigningKey = async (scope: DotStack) => {
  const baseName = 'signing-pubkey';
  const paramName = `${scope.ssmPrefix}/id/${baseName}`;
  const existingKeyId = await getParamValue(paramName);

  if (existingKeyId) {
    return PublicKey.fromPublicKeyId(
      scope,
      `PublicKey-fromPublicKeyId-${+new Date()}`,
      existingKeyId
    );
  }

  // FIXME: We have to not run this for additional deploys to prod
  // because for some reason it fails if the public key exists already
  // https://github.com/aws/aws-cdk/issues/15301
  const keyPair = generateRsaKeyPair();

  addSecret({
    name: `${scope.env}-signing-key-pair`,
    scope,
    secretName: `${scope.ssmPrefix}/key/signing`,
    value: JSON.stringify(keyPair)
  });

  const publicKeyName = scope.resourceName(baseName);
  const cfKey = new PublicKey(scope, publicKeyName, {
    encodedKey: keyPair.publicKey,
    publicKeyName
  });

  scope.overrideId(cfKey, publicKeyName);

  addParam({
    id: `${publicKeyName}-id`,
    name: paramName,
    scope,
    value: cfKey.publicKeyId
  });

  return cfKey;
};
