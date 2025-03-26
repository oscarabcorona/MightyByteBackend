import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';

describe('API Routes', () => {
  it('should return API information on root endpoint', async () => {
    const response = await request(app).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API is running');
    expect(response.body).toHaveProperty('version', '1.0.0');
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});
