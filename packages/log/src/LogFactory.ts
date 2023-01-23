import { PrefixFactory, PrefixFactoryOptions } from 'loglevelnext';
import { DeferredPromise } from 'p-defer';

interface FactoryOptions {
  ready: DeferredPromise<unknown>;
}

export class LogFactory extends PrefixFactory {
  private readonly ready: DeferredPromise<unknown>;

  constructor(options: PrefixFactoryOptions & FactoryOptions) {
    super(void 0, options);

    this.ready = options.ready;
  }

  replaceMethods(level: number | string) {
    super.replaceMethods(level);
    this.ready?.resolve();
  }
}
