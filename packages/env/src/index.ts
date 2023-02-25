import { getLog } from '@dot/log';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import find from 'find-up';

const log = getLog({ brand: '@dot', name: '\u001b[1D/env' });

(() => {
  const path = find.sync('.env');

  if (!path) {
    log.debug('No .env file found, skipping .env load');
    return;
  }

  const env = config({ path });
  expand(env);
})();
