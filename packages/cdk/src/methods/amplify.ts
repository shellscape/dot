import * as Amplify from '@aws-cdk/aws-amplify-alpha';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';

import { DotStack } from '../constructs/Stack';

interface AddAmplifyAppOptions {
  distPath: string;
  domainName?: string;
  environmentVariables?: { [key: string]: string };
  name: string;
  pwaRedirect?: boolean;
  scope: DotStack;
  subdomain?: string;
}

interface AddAmplifyAppResult {
  app: Amplify.App;
}

export const addAmplifyApp = (options: AddAmplifyAppOptions): AddAmplifyAppResult => {
  const { distPath, domainName, environmentVariables = {}, name, pwaRedirect, scope } = options;
  const subdomain = options.subdomain ?? scope.env;
  const baseName = DotStack.baseName(name, '-app');
  const appName = scope.resourceName(baseName);

  const asset = new Asset(scope, `${appName}-asset`, { path: distPath });
  const app = new Amplify.App(scope, appName, {
    appName
  });
  const branch = app.addBranch(scope.env, { asset, environmentVariables });

  app.applyRemovalPolicy(RemovalPolicy.DESTROY);

  // Note: needed for PWA routing
  if (pwaRedirect) {
    app.addCustomRule({
      source: '/<*>',
      status: Amplify.RedirectStatus.NOT_FOUND_REWRITE,
      target: '/index.html'
    });
  }

  if (domainName) {
    const domain = app.addDomain(domainName, {
      enableAutoSubdomain: false
    });
    domain.mapSubDomain(branch, subdomain);
  }

  return { app };
};
