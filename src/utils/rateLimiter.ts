import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly WINDOW_MS = 60 * 1000;
  private readonly MAX_REQUESTS = 10;

  middleware(req: Request, res: Response, next: NextFunction): void {
    const clientId = (req.headers['x-client-id'] as string) || req.ip || 'unknown';
    const now = Date.now();

    let record = this.requestCounts.get(clientId);

    if (!record) {
      record = { count: 0, resetTime: now + this.WINDOW_MS };
      this.requestCounts.set(clientId, record);
    }

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.WINDOW_MS;
    }

    record.count += 1;

    if (record.count > this.MAX_REQUESTS) {
      logger.warn(`Rate limit exceeded for client: ${clientId}`);
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    this.requestCounts.set(clientId, record);
    next();
  }

  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [clientId, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(clientId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} rate limit records`);
    }
  }
}

const limiter = new RateLimiter();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  limiter.middleware(req, res, next);
};

setInterval(
  () => {
    limiter.cleanup();
  },
  5 * 60 * 1000,
);
