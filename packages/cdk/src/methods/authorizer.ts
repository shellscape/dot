import { IdentitySource, RequestAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { Function } from 'aws-cdk-lib/aws-lambda';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function';

export interface AddAuthorizerOptions extends AddNodeFunctionOptions {
  name: string;
}

export interface AddAuthorizerResult {
  authorizer: RequestAuthorizer;
  handler: Function;
}

export const addAuthorizer = (options: AddAuthorizerOptions): AddAuthorizerResult => {
  const { name, scope } = options;
  const authorizerName = `${name}-authorizer`;
  const handler = addNodeFunction({ ...options, name: authorizerName });

  const authorizer = new RequestAuthorizer(scope, authorizerName, {
    handler,
    identitySources: [IdentitySource.header('Authorization')]
  });
  scope.overrideId(authorizer, authorizerName);

  return { authorizer, handler };
};
