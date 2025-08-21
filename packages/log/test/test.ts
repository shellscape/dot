/* eslint-disable no-console */
import test from 'ava';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

test.before(() => {
  sandbox.spy(console, 'debug');
  sandbox.spy(console, 'info');
});

test.afterEach(() => {
  (console.info as sinon.SinonSpy).resetHistory();
  (console.debug as sinon.SinonSpy).resetHistory();
});

test.after(() => {
  sandbox.restore();
});

test.serial('logging', async (t) => {
  t.is((console.info as sinon.SinonSpy).callCount, 0);

  const { getLog } = await import('../dist/index.js');
  const log = getLog();
  const reTime = /\[\d\d:\d\d:\d\d\]/;

  const obj = { bat: 'man' };

  log.debug('joker');
  log.info('batman', obj);
  log.info('robin');

  const [arg] = (console.info as sinon.SinonSpy).getCall(0).args;

  // assert debug logs are hidden/noop
  t.is((console.debug as sinon.SinonSpy).callCount, 0);
  t.truthy(arg);
  // check the timestamp format
  t.regex(arg, reTime);
  // check the entire logged string for consistency
  t.snapshot(arg.replace(reTime, '<timestamp>'));
});

test.serial('nothing logged', async (t) => {
  const { getLog } = await import('../dist/index.js');
  const log = getLog();
  const reTime = /\[\d\d:\d\d:\d\d\]/;

  log.info();

  const [arg] = (console.info as sinon.SinonSpy).getCall(0).args;

  t.truthy(arg);
  t.regex(arg, reTime);
  t.snapshot(arg.replace(reTime, '<timestamp>'));
});

test.serial('brand option', async (t) => {
  const { getLog } = await import('../dist/index.js');
  const log = getLog({ brand: '@dot', name: 'batman' });
  const reTime = /\[\d\d:\d\d:\d\d\]/;

  log.info('joker');

  const [arg] = (console.info as sinon.SinonSpy).getCall(0).args;

  t.truthy(arg);
  t.regex(arg, reTime);
  t.snapshot(arg.replace(reTime, '<timestamp>'));
});

test.serial('name option', async (t) => {
  const { getLog } = await import('../dist/index.js');
  const log = getLog({ name: 'robin' });
  const reTime = /\[\d\d:\d\d:\d\d\]/;

  log.info('joker');

  const [arg] = (console.info as sinon.SinonSpy).getCall(0).args;

  t.truthy(arg);
  t.regex(arg, reTime);
  t.snapshot(arg.replace(reTime, '<timestamp>'));
});

test.serial('DOT_LOG_LEVEL', async (t) => {
  process.env.DOT_LOG_LEVEL = 'debug';
  t.is((console.debug as sinon.SinonSpy).callCount, 0);

  const { getLog } = await import('../dist/index.js');
  const log = getLog({ name: 'joker' });

  log.debug('joker');

  t.is((console.debug as sinon.SinonSpy).callCount, 1);
});
