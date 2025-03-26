import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { logger } from './logger.js';
import { urlShortenerService } from './urlShortener.js';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private shortCodeMap: Map<string, string> = new Map();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      logger.info(`WebSocket client connected: ${clientId}`);

      ws.on('message', (message: string) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
          this.handleMessage(clientId, parsedMessage);
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error}`);
        }
      });

      ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      this.sendMessage(ws, {
        type: 'connection',
        payload: { clientId },
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    logger.debug(`Received message from ${clientId}:`, message);

    switch (message.type) {
      case 'acknowledgment':
        if (message.payload && message.payload.shortCode) {
          urlShortenerService.acknowledgeUrl(message.payload.shortCode).then(success => {
            if (!success) {
              logger.warn(`Failed to acknowledge URL with code: ${message.payload.shortCode}`);
            }
          });
        }
        break;
      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  public sendShortenedUrl(clientId: string, shortCode: string, shortenedUrl: string): void {
    const client = this.clients.get(clientId);

    if (client && client.readyState === WebSocket.OPEN) {
      this.shortCodeMap.set(shortCode, clientId);

      client.send(
        JSON.stringify({
          shortenedURL: shortenedUrl,
        }),
      );

      logger.info(`Sent shortened URL to client ${clientId}: ${shortenedUrl}`);

      urlShortenerService.scheduleRetry(shortCode, code => {
        this.sendShortenedUrl(clientId, code, shortenedUrl);
      });
    } else {
      logger.warn(`Client ${clientId} not connected or not ready`);
    }
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    ws.send(JSON.stringify(message));
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

export const createWebSocketService = (server: http.Server): WebSocketService => {
  return new WebSocketService(server);
};
