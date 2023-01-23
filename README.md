[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# dot

Tools for monorepos, serverless, and more

## Requirements

This repository requires Node v14. A Node Version Manager is recommended, such as [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).

This repository is a monorepo, and managed by [`pnpm`](https://pnpm.io). To install it, run:

```console
$ npm install pnpm -g
```

## Getting Started

From the repository root directory, run the following command to install all dependencies:

```console
$ pnpm install
```

## Packages Found Here

|                           |                                                     |
| ------------------------- | --------------------------------------------------- |
| [config](packages/config) | A configuration contract for Node + AWS projects    |
| [log](packages/log)       | A beautiful and minimal logger for all applications |

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
