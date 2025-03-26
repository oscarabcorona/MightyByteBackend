import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

export const safeExit = (code: number): void => {
  if (process.env.NODE_ENV !== 'test') {
    process.exit(code);
  }
};

export const createServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`Server is running at http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.environment}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      safeExit(0);
    });
  });

  return server;
};

export const startServer = (): void => {
  try {
    createServer();
  } catch (error) {
    logger.error('Failed to start server:', error);
    safeExit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default startServer;
