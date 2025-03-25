import type { default as SentryType, Event, Scope } from '@sentry/node';
import type { MethodFactoryLevels } from 'loglevelnext';

import { Transport, type LogMethodOptions, type SendLogOptions } from '@dot/log';

interface ReportOptions {
  args: any[];
  methodName: string;
  sentryInstance: Promise<typeof SentryType | undefined>;
}

const { warn } = console;
const appEnv: Record<string, string> = {
  default: 'unknown',
  development: 'dev',
  production: 'prod',
  test: 'test'
};
const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const initSentry = async () => {
  if (typeof process === 'undefined') return void 0;

  const {
    DISABLE_SENTRY,
    NODE_ENV,
    RALLY_LOG_LEVEL,
    SENTRY_DSN,
    SENTRY_MODULE,
    SENTRY_SAMPLE_RATE
  } = process.env as Record<string, string>;
  const logLevel = RALLY_LOG_LEVEL as MethodFactoryLevels;

  if (!SENTRY_DSN || !!DISABLE_SENTRY) {
    if (logLevel === 'debug' || logLevel === 'trace') {
      if (DISABLE_SENTRY) warn(`@rally/log → sentry: disabled by way of the DISABLE_SENTRY envar`);
    }
    return void 0;
  }

  const dsn = SENTRY_DSN;
  const enabled = ['prod', 'production'].includes(NODE_ENV);
  const environment = appEnv[NODE_ENV || 'default'];
  const moduleName = SENTRY_MODULE;
  const sampleRate = parseFloat(SENTRY_SAMPLE_RATE || '1');

  const { default: Sentry } = await import('@sentry/node');
  const beforeSend = ((event: Event) => {
    return { ...event, tags: { module: moduleName, ...event.tags } };
  }) as any;
  const initMethod = isLambda ? Sentry.initWithoutDefaultIntegrations : Sentry.init;

  initMethod({
    attachStacktrace: true,
    beforeSend,
    dsn,
    enabled,
    environment,
    sampleRate
  });

  return Sentry;
};

const report = async (options: ReportOptions) => {
  const { args, methodName, sentryInstance } = options;

  const tags = { rallyEnv: process.env.DEPLOY_ENV };
  const [message, ...rest] = args;
  const [maybeOptions] = rest.slice(-1) as LogMethodOptions[];
  const event: Event = { extra: { args: rest }, message, tags };
  const sentry = await sentryInstance;

  if (!sentry) return;

  if (maybeOptions && maybeOptions.data) {
    event.tags = { ...maybeOptions.data };
    rest.pop();
  }

  if (methodName === 'warn') {
    sentry.captureEvent({ level: 'warning', ...event });
  } else if (methodName === 'error') {
    sentry.withScope((scope: Scope) => {
      scope.setExtras(event as any);
      scope.setLevel('error');
      scope.setTags({ message, ...event.tags });

      // Note: The typing in @sentry/types is incorrect: https://github.com/getsentry/sentry-javascript/issues/5764
      // We need to assert that this is a truthy value
      if (message) sentry.captureException(message);
      else warn('@sa/log → sentry: message was falsy:', event);
    });
  }
};

export class SentryTransport extends Transport {
  private sentryInstance: Promise<typeof SentryType | undefined> | undefined = void 0;

  constructor() {
    super();

    this.sentryInstance = initSentry();
  }

  send({ args, methodName }: SendLogOptions) {
    if (!this.sentryInstance) return;
    report({ args, methodName, sentryInstance: this.sentryInstance });
  }
}
