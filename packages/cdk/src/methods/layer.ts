import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';

import { DotStack } from '../constructs/Stack.js';

import { addParam } from './ssm.js';

export interface AddLayerOptions {
  description?: string;
  name: string;
  scope: DotStack;
  sourcePath: string;
}

export const addLayer = (options: AddLayerOptions) => {
  const { description, name, scope, sourcePath } = options;
  const baseName = DotStack.baseName(name, 'layer');
  const layerName = scope.resourceName(baseName);

  const layer = new LayerVersion(scope, layerName, {
    code: Code.fromAsset(sourcePath),
    compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
    description,
    layerVersionName: layerName
  });

  addParam({
    id: `${layerName}-arn-param`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: layer.layerVersionArn
  });

  scope.overrideId(layer, layerName);

  return { layer };
};
