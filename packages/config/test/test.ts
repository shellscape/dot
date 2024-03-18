/* eslint-disable no-undefined */

import test from 'ava';

const stubs = {
  defaultConfig: {},
  pkg: {},
  secretConfig: {},
  ssmConfig: {}
};

test('init', async (t) => {
  const { init } = await import('../src');

  const result = init({ ...stubs });

  t.truthy(result.get);
  t.truthy(result.put);
});

test('get → defaults', async (t) => {
  const defaultConfig = {
    BATMAN_ADDRESS: 'BATCAVE'
  };

  const { init } = await import('../src');
  const { get } = init({ ...stubs, defaultConfig });

  t.is(await get('BATMAN_ADDRESS'), defaultConfig.BATMAN_ADDRESS);
});

test('get → env', async (t) => {
  process.env.BATMAN_ADDRESS = 'BATCAVE';

  const { init } = await import('../src');
  const { get } = init({ ...stubs });

  t.is(await get('BATMAN_ADDRESS'), process.env.BATMAN_ADDRESS);
});

test('get → env with matching default', async (t) => {
  process.env.BATMAN_ADDRESS = 'BATCAVE';

  const defaultConfig = { BATMAN_ADDRESS: 'unknown' };
  const { init } = await import('../src');
  const { get } = init({ ...stubs, defaultConfig });

  t.is(await get('BATMAN_ADDRESS'), process.env.BATMAN_ADDRESS);
});

test('get → secret', async (t) => {
  const secretConfig = {
    BATMAN_ADDRESS: 'batman-address',
    FOO: 'bat'
  };
  const { init } = await import('../src');
  const { get } = init({ ...stubs, secretConfig });

  await get('BATMAN_ADDRESS');

  t.snapshot(await get('BATMAN_ADDRESS'));
});

test('get → ssm', async (t) => {
  const ssmConfig = {
    BATMAN_ADDRESS: '/address/batman'
  };
  const { init } = await import('../src');
  const { get } = init({ ...stubs, ssmConfig });

  t.snapshot(await get('BATMAN_ADDRESS'));
});

test('get → fail', async (t) => {
  const { init } = await import('../src');
  const { get } = init({ ...stubs });
  // @ts-ignore
  const fn = () => get('JOKER_ADDRESS');

  const error = await t.throwsAsync(fn);
  t.snapshot(error);
});

test('disable cache', async (t) => {
  const { init } = await import('../src');
  const { get } = init({ ...stubs });

  process.env.JOKER_ENV = 'batman';

  t.snapshot(await get('JOKER_ENV'));

  process.env.DOT_CONFIG_DISABLE_CACHE = 'true';
  process.env.JOKER_ENV = 'joker';

  t.snapshot(await get('JOKER_ENV'));
});
