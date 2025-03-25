import { Logtail } from '@logtail/node';
import type { StackContextHint } from '@logtail/types';
import type { MethodFactoryLevels } from 'loglevelnext';

import { Transport, type LogMethodOptions, type SendLogOptions } from '@dot/log';

const stackContextHint = {
  fileName: '@rally/log/transports/server/better-stack',
  methodNames: ['log', 'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
} satisfies StackContextHint;
const { warn } = console;

export class BetterStackTransport extends Transport {
  private logtail: Logtail | undefined = void 0;

  constructor() {
    super();

    const { BETTERSTACK_TOKEN, DISABLE_BETTERSTACK, RALLY_LOG_LEVEL } = process.env as Record<
      string,
      string
    >;
    const logLevel = RALLY_LOG_LEVEL as MethodFactoryLevels;

    if (!BETTERSTACK_TOKEN || !!DISABLE_BETTERSTACK) {
      if (logLevel === 'debug' || logLevel === 'trace') {
        if (DISABLE_BETTERSTACK)
          warn(`@rally/log → betterstack: disabled by way of the DISABLE_BETTERSTACK envar`);
      }
      return;
    }

    this.logtail = new Logtail(BETTERSTACK_TOKEN);
  }

  send({ args, methodName }: SendLogOptions) {
    if (!this.logtail) return;

    let data = { rallyEnv: process.env.DEPLOY_ENV };
    const [message, ...rest] = args;
    const [maybeOptions] = rest.slice(-1) as LogMethodOptions[];

    if (maybeOptions?.data) {
      data = { ...data, ...maybeOptions.data };
      rest.pop();
    }

    this.logtail.log(message, methodName, data, stackContextHint);
    this.logtail.flush();
  }
}
