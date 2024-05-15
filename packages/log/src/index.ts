import chalk from 'chalk';
import loglevel, { MethodFactoryLevels } from 'loglevelnext';
import defer from 'p-defer';

import { LogFactory } from './LogFactory';

export interface LogOptions {
  brand?: string;
  name: string;
}

type LogIndex = {
  [key in MethodFactoryLevels]: typeof console.log;
};

interface Log {
  level: MethodFactoryLevels;
}
export type DotLog = Log & Omit<LogIndex, 'silent'>;

const defaultEnv = { DOT_LOG_LEVEL: 'info' };
const ready = defer();
const colors: { [level: string]: string } = {
  debug: chalk`{magenta {inverse  {bold debug }}}`,
  error: chalk`{red {inverse  {bold error }}}`,
  info: chalk`{blue {inverse  {bold info }}}`,
  trace: chalk`{green {inverse  {bold trace }}}`,
  warn: chalk`{yellow {inverse  {bold warn }}}`
};

const defaults: LogOptions = {
  /**
   * @desc Optionally add a logger name which appears at the beginning of a log line, for additional
   *       identification. Also optionally add depth for object nesting level.
   */
  name: ''
};

/**
 * @desc Creates and returns a new log
 */
export const getLog = (opts?: LogOptions) => {
  const options = Object.assign({}, defaults, opts);
  const logName = options.name ? `${options.name} ` : '';
  const brand = options.brand ? chalk` {blue ${options.brand}} ` : ' ';
  const template = `[{{time}}]${brand}${logName}{{level}} `;
  const factory = new LogFactory({
    level: ({ level }: { level: string }) => colors[level],
    ready,
    template,
    time: () => new Date().toTimeString().split(' ')[0]
  } as any);
  const { DOT_LOG_LEVEL = 'info' } = typeof process === 'undefined' ? defaultEnv : process.env;
  const logOptions = {
    factory,
    level: DOT_LOG_LEVEL,
    name: `dot-log:${options.name}`
  };

  const log = loglevel.create(logOptions);

  return log as unknown as DotLog;
};

/**
 * @desc A log singleton. This is the most commonly used export.
 */
export const log = getLog();
