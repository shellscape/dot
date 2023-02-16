import { BackupPlan, BackupPlanRule, BackupResource } from 'aws-cdk-lib/aws-backup';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { DotStack } from '../constructs/Stack';

interface BackupOptions {
  arns?: string[];
  name: string;
  scope: DotStack;
  tables?: Table[];
}

/**
 * @desc Backs up the specified resources each month on the first day of the month at 05:00.
 *       Backups are retained for five years, and moved to cold storage after 30 days.
 */
export const addBackup = (options: BackupOptions) => {
  const { arns = [], scope, tables = [] } = options;
  const id = options.name.replace(/-backup$/, '');
  const name = `${scope.appName}-${id}`;
  const selectionName = `${name}-resources`;
  const plan = new BackupPlan(scope, id, { backupPlanName: name });
  const resources: BackupResource[] = [];

  resources.push(...arns.map((arn) => BackupResource.fromArn(arn)));
  resources.push(...tables.map((table) => BackupResource.fromDynamoDbTable(table)));

  plan.addRule(BackupPlanRule.monthly5Year());
  plan.addSelection(selectionName, { backupSelectionName: selectionName, resources });

  return { plan };
};
