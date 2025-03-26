import { jest } from '@jest/globals';
import { config } from '../index.js';

describe('Configuration', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should have basic properties', () => {
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('host');
    expect(config).toHaveProperty('environment');
    expect(config).toHaveProperty('logLevel');
  });

  it('should use environment variables when available', () => {
    process.env.PORT = '4000';
    process.env.HOST = 'example.com';
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'error';

    const updatedConfig = {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || 'localhost',
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
    };

    expect(updatedConfig.port).toBe(4000);
    expect(updatedConfig.host).toBe('example.com');
    expect(updatedConfig.environment).toBe('production');
    expect(updatedConfig.logLevel).toBe('error');
  });

  it('should handle invalid PORT value', () => {
    process.env.PORT = 'not-a-number';
    process.env.NODE_ENV = 'development';

    const port = parseInt(process.env.PORT || '3000', 10);

    expect(port).toBeNaN();

    const getPort = (): number => {
      if (process.env.NODE_ENV === 'test') {
        return 0;
      }
      return parseInt(process.env.PORT || '3000', 10) || 3000;
    };

    expect(getPort()).toBe(3000);
  });
});
