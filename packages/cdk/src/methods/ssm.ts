import { AssertionError } from 'assert';

import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import SSM from 'aws-sdk/clients/ssm';

import { DotStack } from '../constructs/Stack';

export const paramExists = async (name: string, region: string): Promise<boolean> => {
  const ssm = new SSM({ region });
  try {
    const param = await ssm.getParameter({ Name: name }).promise();
    return param.Parameter?.Value != null;
  } catch (error: any) {
    if (error.code === 'ParameterNotFound') {
      return false;
    }
    throw error;
  }
};

interface AddParamOptions {
  description?: string;
  id: string;
  name: string;
  /**
   * @description Default: false. If true, will assert a static value for this parameter, expecting
   *               that the value will be manually updated.
   */
  placeholder?: boolean;
  scope: DotStack;
  /**
   * @description The value to assign to the parameter. If `placeholder` is true, this value will be
   *              disregarded.
   */
  value?: string;
}

interface GrantLocalOptions {
  consumers: IGrantable[];
  parameters: StringParameter[];
}

interface GrantRemoteOptions {
  consumers: IGrantable[];
  parameterName: string;
  scope: DotStack;
}

type ParameterArn = string;

const VALUE_PLACEHOLDER = '<placeholder>';

export const addParam = (options: AddParamOptions) => {
  const { description, id, name, placeholder = false, scope, value } = options;
  const stringValue = (placeholder ? VALUE_PLACEHOLDER : value) || '';

  if (!placeholder && !value) {
    throw new AssertionError({
      message: `Parameter ${name}: The \`placeholder\` or \`value\` property must be set`
    });
  }

  const param = new StringParameter(scope, id, {
    allowedPattern: '.*',
    description,
    parameterName: name,
    stringValue,
    tier: ParameterTier.STANDARD
  });

  scope.overrideId(param, id);

  return param;
};

export const getRemoteValue = (parameterName: string, scope: DotStack) =>
  StringParameter.valueForStringParameter(scope, parameterName);

export const grantLocal = ({ consumers, parameters }: GrantLocalOptions) => {
  parameters.forEach((param) => {
    consumers.forEach((resource) => param.grantRead(resource));
  });
};

export const grantRemoteParam = ({
  consumers,
  parameterName,
  scope
}: GrantRemoteOptions): ParameterArn => {
  const param = StringParameter.fromStringParameterAttributes(
    scope,
    `${parameterName}-grantRemote`,
    { parameterName }
  );

  consumers.forEach((resource) => param.grantRead(resource));

  return param.parameterArn;
};
