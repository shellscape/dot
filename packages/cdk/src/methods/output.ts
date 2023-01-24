import { CfnOutput } from 'aws-cdk-lib';

import { DotStack } from '../constructs/Stack';

export interface AddOutputOptions {
  name: string;
  scope: DotStack;
  value: any;
}

export const addOutput = ({ name, scope, value }: AddOutputOptions) =>
  new CfnOutput(scope, name, { value });
