import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as apiRouter, redirectRouter } from './routes/index.js';
import { urlRouter } from './routes/url.js';
import { apiDocsRouter } from './routes/api-docs.js';
import { healthRouter } from './routes/health.js';
import { logger } from './utils/logger.js';

const app: Express = express();

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api-docs', apiDocsRouter);

app.use('/health', healthRouter);

app.use('/api', apiRouter);
app.use('/url', urlRouter);

app.use('/', redirectRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'URL Shortener Service',
    docs: '/api-docs',
    health: '/health',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
