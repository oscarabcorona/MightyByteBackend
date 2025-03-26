import { jest } from '@jest/globals';
import { Logger } from '../logger.js';

describe('Logger', () => {
  let originalConsole: typeof console;
  let mockConsole: { [key: string]: jest.Mock };

  beforeEach(() => {
    originalConsole = { ...console };

    mockConsole = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
  });

  afterEach(() => {
    console = originalConsole;
  });

  it('should log at info level', () => {
    const logger = new Logger('info');

    logger.debug('This is a debug message');
    logger.info('This is an info message');
    logger.warn('This is a warning message');
    logger.error('This is an error message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).toHaveBeenCalledTimes(1);
    expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    expect(mockConsole.error).toHaveBeenCalledTimes(1);
  });

  it('should log at debug level', () => {
    const logger = new Logger('debug');

    logger.debug('This is a debug message');
    logger.info('This is an info message');

    expect(mockConsole.debug).toHaveBeenCalledTimes(1);
    expect(mockConsole.info).toHaveBeenCalledTimes(1);
  });

  it('should log at warn level', () => {
    const logger = new Logger('warn');

    logger.debug('This is a debug message');
    logger.info('This is an info message');
    logger.warn('This is a warning message');
    logger.error('This is an error message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    expect(mockConsole.error).toHaveBeenCalledTimes(1);
  });

  it('should handle additional arguments', () => {
    const logger = new Logger('info');
    const additionalArg = { key: 'value' };

    logger.info('Message with object', additionalArg);

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z] \[INFO]/),
      'Message with object',
      additionalArg,
    );
  });

  it('should default to info level for invalid log levels', () => {
    const logger = new Logger('invalid-level' as any);

    logger.debug('This is a debug message');
    logger.info('This is an info message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).toHaveBeenCalledTimes(1);
  });
});
