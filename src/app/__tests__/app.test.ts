import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import express, { Request, Response, NextFunction } from 'express';

const mockLoggerError = jest.fn();

jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: mockLoggerError,
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Express App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return URL Shortener Service message on root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'URL Shortener Service');
  });

  it('should handle 404 errors properly', async () => {
    const testApp = express();

    testApp.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });

    const response = await request(testApp).get('/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });

  it('should handle errors with custom error middleware', async () => {
    const testApp = express();

    const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      mockLoggerError('Unhandled error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    };

    testApp.get('/error-test', (_req, _res, _next) => {
      throw new Error('Test error');
    });

    testApp.use(errorHandler);

    const response = await request(testApp).get('/error-test');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal Server Error');
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
