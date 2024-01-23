import { App, AppProps } from 'aws-cdk-lib';
import {
  ECS_DISABLE_EXPLICIT_DEPLOYMENT_CONTROLLER_FOR_CIRCUIT_BREAKER,
  ENABLE_DIFF_NO_FAIL_CONTEXT,
  STACK_RELATIVE_EXPORTS_CONTEXT
} from '@aws-cdk/cx-api';

export { App };

const defaultContext = {
  [ECS_DISABLE_EXPLICIT_DEPLOYMENT_CONTROLLER_FOR_CIRCUIT_BREAKER]: true,
  [ENABLE_DIFF_NO_FAIL_CONTEXT]: true,
  [STACK_RELATIVE_EXPORTS_CONTEXT]: true
};

export const addApp = (props?: AppProps) => new App({ context: defaultContext, ...props });
