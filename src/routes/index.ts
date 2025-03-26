import express, { Request, Response } from 'express';
import { healthRouter } from './health.js';
import { urlRouter } from './url.js';
import { redirectRouter } from './redirect.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/url', urlRouter);

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
  });
});

export { router, redirectRouter };
