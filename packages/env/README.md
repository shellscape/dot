# @dot/env

Load environment variables from `.env` files.

This tiny package composes a few packages in order to load `.env` intelligently:

- `dotenv`
- `dotenv-expand`
- `find-up`

Differences with `dotenv`:

- Automatically expands variables such as `${NODE_ENV}` within the `.env` files
- Searches the immediate directory (current working directory) for an `.env` file, and if not found, continues to look in parent directories until a `.env` file is found, or `.git` is encountered.

Possible future features:

- [ ] Composing multiple `.env` files
- [ ] Extending `.env` files

## Requirements

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v18+).

## Install

Using pnpm:

```console
pnpm add @dot/env
```

## Usage

Usage is straightforward:

```ts
import '@dot/env';
```

That's it. You're good to go.

## Meta

[CONTRIBUTING](../.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
