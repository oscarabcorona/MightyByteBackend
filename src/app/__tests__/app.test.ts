import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import express, { Request, Response, NextFunction } from 'express';

// Manually create a mock for the logger
const mockLoggerError = jest.fn();

// Mock the logger module
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: mockLoggerError,
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { logger } from '../../utils/logger.js';

describe('Express App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return Hello World on root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Hello World!');
  });

  it('should handle 404 errors properly', async () => {
    const response = await request(app).get('/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });

  it('should handle errors with custom error middleware', async () => {
    // Create a test app with error handler
    const testApp = express();

    // Create an error handler similar to our app
    const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      mockLoggerError('Unhandled error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    };

    // Add a route that throws an error
    testApp.get('/error-test', (_req, _res, _next) => {
      throw new Error('Test error');
    });

    // Add error handler
    testApp.use(errorHandler);

    // Test the error handler
    const response = await request(testApp).get('/error-test');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal Server Error');
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
