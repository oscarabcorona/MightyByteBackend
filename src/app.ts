import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as apiRouter } from './routes/index.js';
import { logger } from './utils/logger.js';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
