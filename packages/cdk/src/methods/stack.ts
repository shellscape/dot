import { App } from 'aws-cdk-lib';

import { DotStack, DotStackProps } from '../constructs/Stack.js';

interface StackOptions extends DotStackProps {
  app: App;
}

export const addStack = (options: StackOptions) => new DotStack(options.app, options);
