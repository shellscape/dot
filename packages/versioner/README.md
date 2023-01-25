# @dot/versioner

A versioning, changelog, and release tool

## Requirements

This package requires an [Active LTS](https://github.com/nodejs/Release) Node version (v14.15.3+).

## A Note on Documentation

Until recently this package was used internally and was not published on the registry. It's grown to a considerable size and it's intended that TypeScript type hinting and intellisense will be used for infomation on usage.

_That said_, documentation here will progressively improve over time.

## Install

Using npm:

```console
npm install @dot/versioner --save-dev
```

## Usage

This package contains a binary which is intended to be the entrypoint for the package.

```console
pnpm exec versioner --target=services/svc-batman
```
