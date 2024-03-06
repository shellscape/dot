import { AssertionError } from 'assert';

import { RemovalPolicy } from 'aws-cdk-lib';
import { BackupPlan, BackupPlanRule, BackupResource } from 'aws-cdk-lib/aws-backup';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

import { DotStack } from '../constructs/Stack';

interface BackupOptions {
  arns?: string[];
  buckets?: Bucket[];
  name: string;
  /**
   * @desc Default: false. If true, the backup uses the Point In Time Recovery method.
   *       If false, the backup uses the standard on-demand method.
   */
  pointInTime?: boolean;
  /*
   * @desc If true, adds a removal policy of RemovalPolicy.RETAIN to the backup plan
   */
  retain?: boolean;
  scope: DotStack;
  tables?: Table[];
}

/**
 * @desc Backs up the specified resources each month on the first day of the month at 05:00.
 *       Backups are retained for five years, and moved to cold storage after 30 days.
 */
export const addBackup = (options: BackupOptions) => {
  const { arns = [], buckets = [], name, pointInTime, retain, scope, tables = [] } = options;
  const id = name.replace(/-backup$/, '');
  const backupPlanName = `${scope.appName}-${id}`;
  const selectionName = `${backupPlanName}-resources`;
  const plan = new BackupPlan(scope, id, { backupPlanName });

  if (buckets.length && (arns.length || tables.length))
    throw new AssertionError({
      message:
        'Due to the need for a specialized role, backups cannot specify buckets AND arns OR tables'
    });

  const resources: BackupResource[] = [
    ...arns.map((arn) => BackupResource.fromArn(arn)),
    ...buckets.map((bucket) => BackupResource.fromArn(bucket.bucketArn)),
    ...tables.map((table) => BackupResource.fromDynamoDbTable(table))
  ];
  let role: Role | undefined;

  if (pointInTime) {
    plan.addRule(
      new BackupPlanRule({
        enableContinuousBackup: true
      })
    );
  } else {
    plan.addRule(BackupPlanRule.monthly5Year());
  }

  if (buckets.length) {
    role = new Role(scope, `${backupPlanName}-service-role`, {
      assumedBy: new ServicePrincipal('backup.amazonaws.com')
    });
    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForBackup')
    );
    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Backup')
    );
  }

  plan.addSelection(selectionName, { backupSelectionName: selectionName, resources, role });

  if (retain) plan.applyRemovalPolicy(RemovalPolicy.RETAIN);

  return { plan };
};
