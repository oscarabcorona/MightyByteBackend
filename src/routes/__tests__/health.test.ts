import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';

describe('Health Check API', () => {
  it('should return 200 and health information', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });
});
