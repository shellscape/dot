# @dot/cdk

A set of tools and conventions for working with AWS CDK.

This package bstracts the class-based CDK library with a functional approach that removes a lot of heavy lifiting and repetitiveness. In addition to a clean interface, this package also automatically adds resources that are frequently used in tandem with other resources, such as SSM parameters for common SQS Queue properties like ARN and URL. Overall, this package attempts to abstract best practices with the AWS CDK that the user doesn't have to think about. Compared with the class-based inteface of AWS CDK, far less code is required to deploy resources, and resources can be understood clearly at a glance.

## Requirements

This package requires an [Active LTS](https://github.com/nodejs/Release) Node version (v18+).

## A Note on Documentation

Until recently this package was used internally and was not published on the registry. It's grown to a considerable size and it's intended that TypeScript type hinting and intellisense will be used for infomation on usage.

_That said_, documentation here will progressively improve over time.

## Install

Using npm:

```console
pnpm add @dot/cdk --save-dev
```

## Usage

The example below demonstrates a few key features:

- creates an `App` app
- creates a `DotStack` stack
- creates a `RestApi` and accompanying `NodeJsFunction`
- creates a Kinesis `DestinationStream` and `Stream` for a Firehose
- grants the handler necessary permissions to interact with the source `Stream`

```ts
import { resolve } from 'path';

import { addApp, addApi, addFirehose, addStack, Duration, RemovalPolicy } from '@dot/cdk';

import { name } from './package.json'; // e.g. svc-batman

const app = addApp();
const scope = addStack({ app, name });
const verbs = ['GET', 'OPTIONS', 'POST'];
const DEPLOY_ENV = 'prod';
const sourcePath = resolve(__dirname, '../src');
const timeout = Duration.minutes(15);

const { handler } = addApi({
  deployEnv: DEPLOY_ENV,
  handler: {
    entryFilePath: 'stream/lambda.ts',
    environmentVariables: { DEPLOY_ENV },
    scope,
    sourcePath,
    timeout
  },
  name: 'stream',
  scope,
  verbs
});

const { sourceStream } = addFirehose({
  destinationBucket: {
    autoDelete: false,
    removalPolicy: RemovalPolicy.RETAIN
  },
  name: 'firehose',
  scope,
  source: { encryption: true }
});

sourceStream.grantWrite(handler);
```

## Meta

[CONTRIBUTING](../.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
