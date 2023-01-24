import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface AddToPolicyOptions {
  grantees: Array<{ role?: IRole }>;
  policyStatement: PolicyStatement;
}

export const addToPolicy = ({ grantees, policyStatement }: AddToPolicyOptions) => {
  grantees.forEach((g) => g.role!.addToPrincipalPolicy(policyStatement));
};

export { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
