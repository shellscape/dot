import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import {
  EmailSubscription,
  LambdaSubscription,
  SqsSubscription
} from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SNSClient, CreateTopicCommand } from '@aws-sdk/client-sns';

import { DotStack } from '../constructs/Stack.js';

import { addNodeFunction, AddNodeFunctionOptions } from './node-function.js';
import { addParam } from './ssm.js';

interface AddTopicOptions {
  displayName?: string;
  emailAddress?: string;
  handler?: Omit<AddNodeFunctionOptions, 'scope'>;
  name: string;
  scope: DotStack;
}

interface AddTopicSubscriptionOptions {
  emailAddress?: string;
  handler?: Omit<AddNodeFunctionOptions, 'scope'>;
  scope: DotStack;
  topic: Topic;
  topicHandler?: Function;
}

interface AddQueueSubscriptionOptions {
  queue: Queue;
  topic: Topic;
}

interface AddTopicSubscriptionResult {
  handler: Function | null;
}

interface GrantRemoteOptions {
  producers: IGrantable[];
  scope: DotStack;
  topicArn?: string;
  topicName?: string;
}

type TopicArn = string;

export const addTopic = (options: AddTopicOptions) => {
  const { displayName, emailAddress, handler, name = '', scope } = options;
  const baseName = DotStack.baseName(name, 'topic');
  const topicName = scope.resourceName(baseName);
  let topicHandler: Function | null = null;

  const topic = new Topic(scope, topicName, { displayName, topicName });

  scope.overrideId(topic, topicName);

  if (emailAddress) addTopicSubscription({ emailAddress, scope, topic });
  if (handler) {
    const sub = addTopicSubscription({ handler, scope, topic });
    topicHandler = sub.handler;
  }

  const arnParam = addParam({
    id: `${topicName}-arn`,
    name: `${scope.ssmPrefix}/arn/${baseName}`,
    scope,
    value: topic.topicArn
  });

  return { arnParam, handler: topicHandler, topic };
};

export const addTopicSubscription = (
  options: AddTopicSubscriptionOptions
): AddTopicSubscriptionResult => {
  const { emailAddress, handler, scope, topic } = options;
  let { topicHandler } = options;
  const required = [emailAddress, handler, topicHandler].filter(Boolean);

  if (required.length > 1 || required.length === 0) {
    throw new RangeError('Pass pass one of `emailAddress`, `handler`, or `topicHandler`');
  }

  if (emailAddress) {
    const emailHandler = new EmailSubscription(emailAddress);
    topic.addSubscription(emailHandler);
    return { handler: null };
  }

  if (handler) topicHandler = addNodeFunction({ ...handler, scope });

  topic.addSubscription(new LambdaSubscription(topicHandler!));

  return { handler: topicHandler! };
};

export const addQueueSubscription = (options: AddQueueSubscriptionOptions) => {
  const { queue, topic } = options;
  topic.addSubscription(new SqsSubscription(queue));
};

export const grantRemoteTopic = async ({
  producers,
  scope,
  topicName,
  topicArn
}: GrantRemoteOptions): Promise<TopicArn> => {
  if ((!topicArn && !topicName) || (topicArn && topicName)) {
    throw new RangeError(`grantRemoteTopic requires either topicArn or topicName parameter`);
  }
  const theTopicArn = topicArn || (await lookupTopicArn(topicName!));
  if (!theTopicArn) {
    throw new Error(`Cannot lookup TopicArn for the SNS Topic with name ${topicName}`);
  }
  const topic = Topic.fromTopicArn(scope, `${Date.now()}-grantRemoteTopic`, theTopicArn);
  producers.forEach((resource) => topic.grantPublish(resource));

  return theTopicArn;
};

const lookupTopicArn = async (topicName: string) => {
  const client = new SNSClient({ region: DotStack.awsRegion });
  const command = new CreateTopicCommand({ Name: topicName });
  const { TopicArn } = await client.send(command);

  return TopicArn;
};
