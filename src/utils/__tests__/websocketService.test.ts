import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { WebSocketService } from '../websocketService.js';
import { urlShortenerService } from '../urlShortener.js';
import { jest } from '@jest/globals';

jest.setTimeout(20000);

jest.mock('../urlShortener.js');

beforeEach(() => {
  jest.resetAllMocks();

  (urlShortenerService.acknowledgeUrl as jest.Mock).mockResolvedValue('');
  (urlShortenerService.scheduleRetry as jest.Mock).mockImplementation(() => {});
});

describe('WebSocket Service', () => {
  let httpServer: http.Server;
  let wsService: WebSocketService;
  let clients: WebSocket[] = [];

  beforeAll(done => {
    httpServer = http.createServer();

    httpServer.listen(0, () => {
      done();
    });
  });

  afterAll(done => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }

    httpServer.close(() => {
      done();
    });
  });

  beforeEach(() => {
    wsService = new WebSocketService(httpServer);
    clients = [];
  });

  afterEach(() => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }
  });

  describe('connection handling', () => {
    it('should assign a client ID on connection', done => {
      const address = httpServer.address() as { port: number };
      const port = address.port;

      const ws = new WebSocket(`ws://localhost:${port}`);
      clients.push(ws);

      ws.on('open', () => {
        console.log('WebSocket connection established in test');
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection') {
          expect(message.payload).toBeDefined();
          expect(message.payload.clientId).toMatch(/^client-\d+-\d+$/);
          done();
        }
      });

      ws.on('error', error => {
        console.error('WebSocket error in test:', error);
        done(error);
      });
    }, 10000);
  });

  describe('message handling', () => {
    it('should handle acknowledgment messages', done => {
      const address = httpServer.address() as { port: number };
      const port = address.port;

      const ws = new WebSocket(`ws://localhost:${port}`);
      clients.push(ws);

      let clientId: string;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection') {
          clientId = message.payload.clientId;

          ws.send(
            JSON.stringify({
              type: 'acknowledgment',
              payload: {
                shortCode: 'testCode123',
              },
            }),
          );

          setTimeout(() => {
            expect(urlShortenerService.acknowledgeUrl).toHaveBeenCalledWith('testCode123');
            done();
          }, 100);
        }
      });

      ws.on('error', error => {
        done(error);
      });
    });

    it('should handle unknown message types', done => {
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const address = httpServer.address() as { port: number };
      const port = address.port;

      const ws = new WebSocket(`ws://localhost:${port}`);
      clients.push(ws);

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection') {
          ws.send(
            JSON.stringify({
              type: 'unknown',
              payload: {},
            }),
          );

          setTimeout(() => {
            console.warn = originalWarn;
            done();
          }, 100);
        }
      });

      ws.on('error', error => {
        console.warn = originalWarn;
        done(error);
      });
    });
  });
  describe('sendShortenedUrl', () => {
    let mockSendMessage: jest.Mock;

    beforeEach(() => {
      mockSendMessage = jest
        .spyOn(wsService as any, 'sendMessage')
        .mockImplementation(() => {}) as jest.Mock;
    });

    afterEach(() => {
      mockSendMessage.mockRestore();
    });

    it('should send the shortened URL to the client', () => {
      const clientId = 'test-client-id';
      const shortCode = 'testCode123';
      const shortenedUrl = 'http://localhost:3000/testCode123';

      const mockClient = {
        readyState: WebSocket.OPEN,
      } as WebSocket;

      (wsService as any).clients.set(clientId, mockClient);

      wsService.sendShortenedUrl(clientId, shortCode, shortenedUrl);

      expect(mockSendMessage).toHaveBeenCalledWith(mockClient, {
        type: 'shortenedUrl',
        payload: {
          shortCode,
          shortenedURL: shortenedUrl,
        },
      });

      expect(urlShortenerService.scheduleRetry).toHaveBeenCalledWith(
        shortCode,
        expect.any(Function),
      );
    });

    it('should not send to non-existent clients', () => {
      const clientId = 'non-existent-client';
      const shortCode = 'testCode123';
      const shortenedUrl = 'http://localhost:3000/testCode123';

      wsService.sendShortenedUrl(clientId, shortCode, shortenedUrl);

      expect(mockSendMessage).not.toHaveBeenCalled();

      expect(urlShortenerService.scheduleRetry).not.toHaveBeenCalled();
    });
  });
});
