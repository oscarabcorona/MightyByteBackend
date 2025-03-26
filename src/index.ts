import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { createWebSocketService } from './utils/websocketService.js';
import { urlShortenerService } from './utils/urlShortener.js';

export const safeExit = (code: number): void => {
  if (process.env.NODE_ENV !== 'test') {
    process.exit(code);
  }
};

export const createServer = () => {
  const server = http.createServer(app);

  const websocketService = createWebSocketService(server);

  app.locals.websocketService = websocketService;

  const CLEANUP_INTERVAL = 60 * 60 * 1000;
  const cleanupTask = setInterval(() => {
    logger.info('Running scheduled cleanup of expired URLs');
    urlShortenerService.cleanupExpiredUrls();
  }, CLEANUP_INTERVAL);

  server.listen(config.port, () => {
    logger.info(`Server is running at http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.environment}`);
    logger.info('WebSocket server initialized');
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    clearInterval(cleanupTask);
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
