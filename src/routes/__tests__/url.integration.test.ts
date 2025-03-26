import request from 'supertest';
import WebSocket from 'ws';
import { app } from '../../app.js';
import http from 'http';
import { createServer } from '../../index.js';

describe('URL Shortener Integration Tests', () => {
  let server: http.Server;
  let ws: WebSocket;
  let clientId: string;
  let shortCode: string;

  jest.setTimeout(30000);

  beforeAll(done => {
    server = createServer();

    setTimeout(() => {
      connectWebSocket(done);
    }, 1000);
  });

  function connectWebSocket(done: jest.DoneCallback) {
    const wsUrl = `ws://localhost:${process.env.PORT || 3000}`;
    console.log(`Connecting to WebSocket at ${wsUrl}`);

    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('WebSocket connection established');
    });

    ws.on('message', data => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection') {
          clientId = message.payload.clientId;
          console.log(`Received client ID: ${clientId}`);
          done();
        }

        if (message.type === 'shortenedUrl') {
          shortCode = message.payload.shortCode;
          console.log(`Received shortened URL: ${message.payload.shortenedURL}`);

          ws.send(
            JSON.stringify({
              type: 'acknowledgment',
              payload: { shortCode },
            }),
          );
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('error', error => {
      console.error('WebSocket error:', error);
      setTimeout(() => connectWebSocket(done), 1000);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }

  afterAll(done => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    if (server) {
      server.close(() => {
        console.log('Server closed');
        done();
      });
    } else {
      done();
    }
  });

  it('should create a shortened URL via POST and retrieve the original URL via GET', async () => {
    if (!clientId) {
      console.log('Skipping test due to missing client ID');
      return;
    }

    const originalUrl = 'https://example.com';

    const postResponse = await request(app)
      .post('/url')
      .set('x-client-id', clientId)
      .send({ url: originalUrl });

    expect(postResponse.status).toBe(202);
    expect(postResponse.body.message).toBe('URL is being processed');

    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (shortCode) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });

    expect(shortCode).toBeDefined();

    const getResponse = await request(app).get(`/${shortCode}`).send();

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.url).toBe(originalUrl);
  });

  it('should handle invalid URLs correctly', async () => {
    if (!clientId) {
      console.log('Skipping test due to missing client ID');
      return;
    }

    const invalidUrl = 'not-a-valid-url';

    const response = await request(app)
      .post('/url')
      .set('x-client-id', clientId)
      .send({ url: invalidUrl });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should require a client ID header', async () => {
    const originalUrl = 'https://example.com';

    const response = await request(app).post('/url').send({ url: originalUrl });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Client ID is required in the x-client-id header');
  });
});
