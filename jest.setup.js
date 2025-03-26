import { config } from 'dotenv';

config({ path: '.env.test' });

globalThis.SKIP_INTEGRATION_TESTS = false;

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.LOG_LEVEL = 'error';

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection in tests:', err);
});
