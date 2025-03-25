import type { MethodFactoryLevels } from 'loglevelnext';

export interface LogMethodOptions {
  data: Record<string, string | number>;
}

export interface SendLogOptions {
  args: [string, ...unknown[]];
  methodName: MethodFactoryLevels;
}

export abstract class Transport {
  abstract send(options: SendLogOptions): void;
}
