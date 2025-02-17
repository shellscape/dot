import { AssertionError } from 'assert';

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { nanoid } from 'nanoid';

import { DotStack } from '../constructs/Stack';

export const getParamValue = async (name: string) => {
  try {
    const client = new SSMClient({ region: DotStack.awsRegion });
    const command = new GetParameterCommand({ Name: name });
    const result = await client.send(command);

    return result.Parameter?.Value;
  } catch (error: any) {
    return void 0;
  }
};

export const paramExists = async (name: string): Promise<boolean> => {
  try {
    const client = new SSMClient({ region: DotStack.awsRegion });
    const command = new GetParameterCommand({ Name: name });
    const result = await client.send(command);

    return result.Parameter?.Value != null;
  } catch (error: any) {
    if (error.name === 'ParameterNotFound') {
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
  const lastSegment = parameterName.split('/').at(-1);
  const id = `${nanoid()}-${lastSegment}-grantRemoteParam`;
  const param = StringParameter.fromStringParameterAttributes(scope, id, { parameterName });

  consumers.forEach((resource) => param.grantRead(resource));

  return param.parameterArn;
};
