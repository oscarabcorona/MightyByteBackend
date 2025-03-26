import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private readonly level: number;

  constructor(logLevel: string) {
    this.level = logLevels[logLevel as LogLevel] ?? logLevels.info;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (logLevels[level] >= this.level) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      if (args.length > 0) {
        console[level](prefix, message, ...args);
      } else {
        console[level](prefix, message);
      }
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger(config.logLevel);
