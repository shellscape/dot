import type { PrefixFactoryOptions } from 'loglevelnext';
import { PrefixFactory } from 'loglevelnext';
import type { DeferredPromise } from 'p-defer';

import type { Transport } from './Transport';

interface FactoryOptions {
  ready: DeferredPromise<unknown>;
  transports?: Transport[];
}

export type LogMethodArgs = [string, ...unknown[]];

const NOOP = '() => { }';

export class LogFactory extends PrefixFactory {
  private readonly ready: DeferredPromise<unknown>;
  private readonly transports: Transport[];

  constructor(options: PrefixFactoryOptions & FactoryOptions) {
    super(void 0, options);

    this.ready = options.ready;
    this.transports = options.transports || [];
  }

  override make(methodName: any) {
    const og = super.make(methodName);
    return (...args: LogMethodArgs) => {
      // is the method a noop?
      if (og.toString() !== NOOP) {
        this.transports.forEach((transport) => transport.send({ args, methodName }));
      }

      // call the original method and output to console
      og(...args);
    };
  }

  override replaceMethods(level: number | string) {
    super.replaceMethods(level);
    this.ready?.resolve();
  }
}
