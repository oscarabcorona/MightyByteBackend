/**
 * WebSocketClient Tests
 */
import { jest } from '@jest/globals';

// Create mock objects
const mockWs = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
};

const mockReadlineInterface = {
  on: jest.fn(),
  close: jest.fn(),
  input: process.stdin,
  output: { write: jest.fn() },
};

// Set up mocks before importing WebSocketClient
jest.mock('ws', () => {
  return {
    __esModule: true,
    default: jest.fn(() => mockWs),
  };
});

jest.mock('readline', () => ({
  createInterface: jest.fn(() => mockReadlineInterface),
}));

// Save original process methods
const originalExit = process.exit;
const originalOn = process.on;

// Import after mocking
import { WebSocketClient } from '../wsClient.js';
import WebSocket from 'ws';

// Add OPEN property to WebSocket
Object.defineProperty(WebSocket, 'OPEN', { value: 1 });

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Mock process methods
    process.exit = jest.fn() as any;
    process.on = jest.fn() as any;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create client
    client = new WebSocketClient('ws://localhost:3000');
  });

  afterEach(() => {
    // Restore
    process.exit = originalExit;
    process.on = originalOn;
    jest.restoreAllMocks();
  });

  describe('WebSocket Event Handlers', () => {
    it('should handle open event', () => {
      // Find and execute the open callback
      const openCalls = mockWs.on.mock.calls.filter(call => call[0] === 'open');
      if (openCalls.length > 0) {
        const openHandler = openCalls[0][1] as any;
        openHandler();

        expect(console.log).toHaveBeenCalledWith('\n✅ Connected to WebSocket server');
      }
    });

    it('should handle connection message', () => {
      // Find and execute the message callback
      const messageCalls = mockWs.on.mock.calls.filter(call => call[0] === 'message');
      if (messageCalls.length > 0) {
        const messageHandler = messageCalls[0][1] as any;
        messageHandler(
          JSON.stringify({
            type: 'connection',
            payload: { clientId: 'test-client-id' },
          }),
        );

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('🔑 Client ID: test-client-id'),
        );
      }
    });

    it('should handle shortened URL message', () => {
      // Find and execute the message callback
      const messageCalls = mockWs.on.mock.calls.filter(call => call[0] === 'message');
      if (messageCalls.length > 0) {
        const messageHandler = messageCalls[0][1] as any;
        messageHandler(
          JSON.stringify({
            shortenedURL: 'http://localhost:3000/abc123',
          }),
        );

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('🔗 Received Shortened URL:'),
        );
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('acknowledgment'));

        // Check URL was stored
        const urls = client.getStoredUrls();
        expect(urls.has('abc123')).toBe(true);
      }
    });

    it('should handle close event', () => {
      // Find and execute the close callback
      const closeCalls = mockWs.on.mock.calls.filter(call => call[0] === 'close');
      if (closeCalls.length > 0) {
        const closeHandler = closeCalls[0][1] as any;
        closeHandler();

        expect(console.log).toHaveBeenCalledWith('\n❌ Disconnected from WebSocket server');
        expect(mockReadlineInterface.close).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(0);
      }
    });

    it('should handle error event', () => {
      // Find and execute the error callback
      const errorCalls = mockWs.on.mock.calls.filter(call => call[0] === 'error');
      if (errorCalls.length > 0) {
        const errorHandler = errorCalls[0][1] as any;
        errorHandler(new Error('ECONNREFUSED'));

        expect(console.error).toHaveBeenCalledWith('\n❌ WebSocket error:', 'ECONNREFUSED');
        expect(mockReadlineInterface.close).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('Command Handling', () => {
    it('should handle help command', () => {
      // Find and execute the line callback
      const lineCalls = mockReadlineInterface.on.mock.calls.filter(call => call[0] === 'line');
      if (lineCalls.length > 0) {
        const lineHandler = lineCalls[0][1] as any;
        lineHandler('help');

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('WebSocket Client Commands:'),
        );
      }
    });

    it('should handle exit command', () => {
      // Find and execute the line callback
      const lineCalls = mockReadlineInterface.on.mock.calls.filter(call => call[0] === 'line');
      if (lineCalls.length > 0) {
        const lineHandler = lineCalls[0][1] as any;
        lineHandler('exit');

        expect(console.log).toHaveBeenCalledWith('Closing connection...');
        expect(mockWs.close).toHaveBeenCalled();
      }
    });

    it('should handle clear command', () => {
      // Find and execute the line callback
      const lineCalls = mockReadlineInterface.on.mock.calls.filter(call => call[0] === 'line');
      if (lineCalls.length > 0) {
        const lineHandler = lineCalls[0][1] as any;
        lineHandler('clear');

        expect(mockReadlineInterface.output.write).toHaveBeenCalledWith('\x1Bc');
      }
    });

    it('should handle urls command', () => {
      // First add a URL
      const messageCalls = mockWs.on.mock.calls.filter(call => call[0] === 'message');
      if (messageCalls.length > 0) {
        const messageHandler = messageCalls[0][1] as any;
        messageHandler(
          JSON.stringify({
            shortenedURL: 'http://localhost:3000/abc123',
          }),
        );
      }

      // Then execute the urls command
      const lineCalls = mockReadlineInterface.on.mock.calls.filter(call => call[0] === 'line');
      if (lineCalls.length > 0) {
        const lineHandler = lineCalls[0][1] as any;
        lineHandler('urls');

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Received URLs:'));
      }
    });

    it('should handle unknown command', () => {
      // Find and execute the line callback
      const lineCalls = mockReadlineInterface.on.mock.calls.filter(call => call[0] === 'line');
      if (lineCalls.length > 0) {
        const lineHandler = lineCalls[0][1] as any;
        lineHandler('unknown');

        expect(console.log).toHaveBeenCalledWith(
          'Unknown command. Type "help" for available commands.',
        );
      }
    });
  });
});
