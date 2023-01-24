import { getLog } from '@dot/log';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import find from 'find-up';

const log = getLog({ name: '/env' });

(async () => {
  const path = await find('.env');

  if (!path) {
    log.debug('No .env file found, skipping .env load');
    return;
  }

  const env = config({ path });
  expand(env);
})();
