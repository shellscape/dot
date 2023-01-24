import { RemovalPolicy } from 'aws-cdk-lib';
import {
  Attribute,
  BillingMode,
  GlobalSecondaryIndexProps,
  ProjectionType,
  Table
} from 'aws-cdk-lib/aws-dynamodb';
import { IGrantable } from 'aws-cdk-lib/aws-iam';

import { DotStack } from '../constructs/Stack';

interface TableExistsOptions {
  scope: DotStack;
  tableName: string;
}

interface AddTableOptions {
  consumers?: IGrantable[];
  name: string;
  partitionKey: Attribute;
  prefix?: boolean;
  producers?: IGrantable[];
  scope: DotStack;
  sortKey?: Attribute;
}

interface AddGlobalIndexOptions {
  indexName: string;
  partitionKey: Attribute;
  projectionType: ProjectionType;
  projectionKeys?: string[];
}

export { Attribute, AttributeType } from 'aws-cdk-lib/aws-dynamodb';

export const tableExists = ({ scope, tableName }: TableExistsOptions) => {
  const table = Table.fromTableName(scope, `${Date.now()}-tableExists`, tableName);
  return !!table;
};

export const addTable = (options: AddTableOptions) => {
  const { consumers = [], partitionKey, producers = [], scope, sortKey } = options;
  const name = options.name.replace(/-table$/, '');
  const prefix = options.prefix ? `${scope.appName}-` : '';
  const tableName = `${scope.envPrefix}${prefix}${name}`;
  // tableId is the CDK id/name for the table, whereas tableName is the actual name of the table in
  // DynamoDB
  const tableId = `${tableName}-table`;

  const table = new Table(scope, tableId, {
    billingMode: BillingMode.PAY_PER_REQUEST,
    partitionKey,
    pointInTimeRecovery: scope.env === 'prod',
    removalPolicy: RemovalPolicy.DESTROY,
    sortKey,
    tableName
  });

  scope.overrideId(table, tableId);

  consumers.forEach((resource) => table.grantReadData(resource));
  producers.forEach((resource) => table.grantWriteData(resource));

  return table;
};

export const addGlobalIndex = async (table: Table, props: AddGlobalIndexOptions) => {
  const indexProps: GlobalSecondaryIndexProps = {
    ...props
  };
  table.addGlobalSecondaryIndex(indexProps);
};
