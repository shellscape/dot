import { App, AppProps } from 'aws-cdk-lib';

export { App };

export const addApp = (props?: AppProps) => new App(props);
