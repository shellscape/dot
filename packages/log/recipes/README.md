# @dot/log Recipes

This directory contains recipes for extending @dot/log with additional transports and functionality.

## Available Recipes

- [Better Stack Transport](./better-stack.ts) - Integration with Better Stack logging service
- [Sentry Transport](./sentry.ts) - Integration with Sentry error tracking and performance monitoring

Each recipe provides a custom Transport implementation that can be used with @dot/log to send logs to additional services beyond the default console output.

To use a recipe, import the transport class and add it to the transports array when creating a logger:

```ts
import { getLog } from '@dot/log';
import { SentryTransport } from '@dot/log/recipes/sentry';

const log = getLog({
  name: 'my-app',
  transports: [new SentryTransport()]
});
```
