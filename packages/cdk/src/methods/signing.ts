import { generateKeyPairSync } from 'crypto';

import { PublicKey } from 'aws-cdk-lib/aws-cloudfront';

import { type DotStack } from '../constructs/Stack';

import { addSecret } from './secret';
import { addParam } from './ssm';

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

export const addSigningKey = (scope: DotStack) => {
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

  const baseName = 'signing-pubkey';
  const publicKeyName = scope.resourceName(baseName);
  const cfKey = new PublicKey(scope, publicKeyName, {
    encodedKey: keyPair.publicKey,
    publicKeyName
  });

  scope.overrideId(cfKey, publicKeyName);

  addParam({
    id: `${publicKeyName}-id`,
    name: `${scope.ssmPrefix}/id/${baseName}`,
    scope,
    value: cfKey.publicKeyId
  });
};
