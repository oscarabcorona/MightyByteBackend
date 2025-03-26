import express, { Request, Response } from 'express';
import { healthRouter } from './health.js';

const router = express.Router();

router.use('/health', healthRouter);

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
  });
});

export { router };
