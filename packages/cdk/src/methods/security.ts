// Note: Lifted from here: https://github.com/awslabs/aws-solutions-constructs/blob/main/source/patterns/%40aws-solutions-constructs/core/lib/security-group-helper.ts#L26
import * as cdk from 'aws-cdk-lib';
import { IPeer, Port, SecurityGroup, SecurityGroupProps } from 'aws-cdk-lib/aws-ec2';

import { DotStack } from '../constructs/Stack';

interface AddSecurityGroupArgs extends SecurityGroupProps {
  egressRules?: SecurityGroupRuleDefinition[];
  id: string;
  ingressRules?: SecurityGroupRuleDefinition[];
  scope: DotStack;
}

interface CfnNagSuppressRule {
  readonly id: string;
  readonly reason: string;
}

interface SecurityGroupRuleDefinition {
  // example: ec2.Peer.ipV4(vpc.vpcCiderBlock)
  readonly peer: IPeer;
  readonly connection: Port;
  readonly description?: string;
  readonly remoteRule?: boolean;
}

export const addSecurityGroup = (args: AddSecurityGroupArgs) => {
  const { egressRules, id, ingressRules, scope } = args;
  const newSecurityGroup = new SecurityGroup(scope, id, args);

  ingressRules?.forEach((rule) => {
    newSecurityGroup.addIngressRule(rule.peer, rule.connection, rule.description, rule.remoteRule);
  });

  egressRules?.forEach((rule) => {
    newSecurityGroup.addEgressRule(rule.peer, rule.connection, rule.description, rule.remoteRule);
  });

  addCfnSuppressRules(newSecurityGroup, [
    {
      id: 'W5',
      reason: 'Egress of 0.0.0.0/0 is default and generally considered OK'
    },
    {
      id: 'W40',
      reason: 'Egress IPProtocol of -1 is default and generally considered OK'
    }
  ]);

  return newSecurityGroup;
};

const addCfnSuppressRules = (
  resource: cdk.Resource | cdk.CfnResource,
  rules: CfnNagSuppressRule[]
) => {
  if (resource instanceof cdk.Resource) {
    resource = resource.node.defaultChild as cdk.CfnResource;
  }

  if (resource.cfnOptions.metadata?.cfn_nag?.rules_to_suppress) {
    resource.cfnOptions.metadata?.cfn_nag.rules_to_suppress.push(...rules);
  } else {
    resource.addMetadata('cfn_nag', {
      rules_to_suppress: rules
    });
  }
};
