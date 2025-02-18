import { IPublicKey, PublicKey } from 'aws-cdk-lib/aws-cloudfront';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { CfnOutput, CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import { InlineCode, Function, Runtime } from 'aws-cdk-lib/aws-lambda';

import { type DotStack } from '../constructs/Stack';

import { addSecret } from './secret';
import { addParam, getParamValue } from './ssm';

export const getKeyPair = (scope: DotStack) => {
  const keyGenFunction = new Function(scope, 'KeyGen', {
    code: new InlineCode(`
          exports.handler=async e=>{
            if(e.RequestType!='Delete'){
              const k=require('crypto').generateKeyPairSync('rsa',{
                modulusLength:2048,
                privateKeyEncoding:{format:'pem',type:'pkcs8'},
                publicKeyEncoding:{format:'pem',type:'spki'}
              });
              return{Data:{publicKey:k.publicKey,keyPair:JSON.stringify(k)}};
            }
            return{};
          }`),
    handler: 'index.handler',
    runtime: Runtime.NODEJS_20_X
  });

  const customResource = new CustomResource(scope, 'KeyGenResource', {
    serviceToken: new Provider(scope, 'KeyGenProvider', {
      onEventHandler: keyGenFunction
    }).serviceToken
  });

  return {
    keyPair: customResource.getAttString('keyPair'),
    publicKey: customResource.getAttString('publicKey')
  };
};

export const addSigningKey = async (scope: DotStack) => {
  const baseName = 'signing-pubkey';
  const publicKeyName = scope.resourceName(baseName);
  const paramName = `${scope.ssmPrefix}/id/${baseName}`;
  const existingKeyId = await getParamValue(paramName);
  const secretName = `${scope.ssmPrefix}/key/signing`;
  const keys = getKeyPair(scope);
  let publicKey: IPublicKey;

  if (existingKeyId) {
    publicKey = PublicKey.fromPublicKeyId(
      scope,
      `PublicKey-fromPublicKeyId-${+new Date()}`,
      existingKeyId
    ) as any;
  } else {
    publicKey = new PublicKey(scope, publicKeyName, {
      encodedKey: keys.publicKey,
      publicKeyName
    });
    scope.overrideId(publicKey as any, publicKeyName);
    publicKey.applyRemovalPolicy(RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE);
  }

  const { secret: publicKeySecret } = addSecret({
    name: `${scope.env}-signing-key-pair`,
    scope,
    secretName,
    value: keys.keyPair
  });

  const publicKeyParam = addParam({
    id: `${publicKeyName}-id`,
    name: paramName,
    scope,
    value: publicKey.publicKeyId
  });

  // Note: We HAVE to output this, or else CDK will think we're
  // not using the result of PublicKey.fromPublicKeyId and will discard it
  // which effectively deletes the publicKey that was created in an initial
  // deploy (but not in subsequent deploys)
  // eslint-disable-next-line no-new
  new CfnOutput(scope, 'cloudfrontPublicKeyId', {
    value: publicKey.publicKeyId
  });

  return { publicKey, publicKeyParam, publicKeySecret };
};
