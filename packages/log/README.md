# @dot/log

A beautiful and minimal logger for all applications

## Requirements

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v18+).

## Install

Using npm:

```console
npm install @dot/log --save
```

## Usage

Create a new logger and use it to log something wild:

```js
import { log } from '@dot/log';

log.info('Jingle Bells, Batman Smells');
log.warn('Robin laid an egg');
log.error('The Batmobile lost a wheel');
log.debug('And the Joker got away');
```

And there will appear magic in your console

To name the log pass the name in the getLog options:

```
const log = getLog({ name: 'batman' });
```

When logging an object the nesting can be only one level deep.
If the nesting level of the object exceeds one level then a RangeError exception will be thrown.

### Setting the Log Level

By default, each log instance is set to the `'info'` level. The log level can be set one of two ways:

1. By direct manipulation of the log itself, which can be useful for one-off log instances:

```ts
import { log } from '@dot/log';

log.level = 'debug'; // change from the default 'info' level
```

2. Using an the `DOT_LOG_LEVEL` environment variable:

```env
DOT_LOG_LEVEL=debug
```

## Meta

[CONTRIBUTING](../.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
