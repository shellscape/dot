# @dot/config

A configuration contract for Node + AWS projects.

The contract that this package implements covers the following:

- Error handling and assertion of configuration values. Empty or missing values stop execution.
- Ease of access to environment variables
- Ease of access to AWS SSM Parameters
- Ease of access to AWS Secrets Manager secrets
- No need to use or access `process.env`
- Specify default values for configuration
- Provide canonical environment names, centalize environment parsing

For TypeScript users, known configuration values are provided in intellisense based on the keys of configuration options passed to `init`.

## Requirements

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v18+).

## Install

Using pnpm:

```console
pnpm add @dot/config
```

## Usage

```ts
import { env, init } from '@dot/config';

const defaultConfig = { ... };
const secretConfig = {
  BATCAVE_CODE: `/${env}/batcave/code`
};
const ssmConfig = { ... };
const { get } = init({ defaultConfig, pkg, secretConfig, ssmConfig });

const value = await get('BATCAVE_CODE');
```

## Exports

### `DotEnv`

Type: `Enum`<br>

An `enum` representing common Node, deployment, or run environments.

```ts
enum DotEnv {
  DEV = 'dev',
  PROD = 'prod',
  STAGE = 'stage',
  TEST = 'test'
}
```

### `env`

Type: `String`<br>

Represents the current `env` value, corresponding to `DotEnv`.

### `envPrefix`

Type: `String`<br>

Represents the current `env` value in a prefix useful for deployment resource identifiers and other identifiers or prefixes. e.g. `prod-`

### `init`

Type: `Function`<br>
Returns: `{ get, put }`

Initializes a configuration getter and putter.

#### Options

##### `defaultConfig`

Type: `Object`<br>

An `object` whereby keys identify configuration values.

##### `secretConfig`

Type: `Object`<br>

An `object` whereby keys match AWS SecretsManager names.

##### `ssmConfig`

Type: `Object`<br>

An `object` whereby keys match AWS SSM Parameter Store paths.

#### `get`

Type: `Function`<br>
Parameters: `(key: String)`<br>
Returns: `Promise<String | Number>`

Get a value for the specified key. The key may represent a key present on:

- `process.env`
- The default configuration object
- The secrets configuration object
- The SSM configuration object

If the key does not exist, or the value returned from any of the possible sources is `undefined`, a `RangeError` is thrown.<br>

```ts
const name = await get('BATMAN');
```

#### `put`

Type: `Function`<br>
Parameters: `(key: String, value: any)`<br>
Returns: [`Promise<AWS Response>`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Response.html)

Saves a value to the specified key, which corresponds to an AWS SSM Parameter Path. This function is limited to AWS SSM Parameter Store.

```ts
await put('DB_NAME', 'batman');
```

## Meta

[CONTRIBUTING](../.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
