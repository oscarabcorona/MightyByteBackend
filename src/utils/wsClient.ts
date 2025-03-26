#!/usr/bin/env node

/**
 * WebSocket Client for URL Shortener Service
 *
 * This script connects to the WebSocket server and listens for
 * shortened URLs. It will also acknowledge receipt of URLs.
 *
 * Use the client ID displayed in the console as the x-client-id header
 * when making POST requests to the /url endpoint.
 *
 * Usage:
 *   npm run ws-client:dev (development)
 *   npm run ws-client (production)
 */

import WebSocket from 'ws';
import readline from 'readline';
import process from 'process';

/**
 * Base WebSocket message interface
 */
interface BaseMessage {
  type: string;
  payload: Record<string, any>;
}

/**
 * Connection message received after connecting to the WebSocket server
 */
interface ConnectionMessage extends BaseMessage {
  type: 'connection';
  payload: {
    clientId: string;
  };
}

/**
 * Shortened URL message received when a URL is shortened
 */
interface ShortenedUrlMessage {
  shortenedURL: string;
}

/**
 * Acknowledgment message sent to confirm receipt of a shortened URL
 */
interface AcknowledgmentMessage extends BaseMessage {
  type: 'acknowledgment';
  payload: {
    shortCode: string;
  };
}

/**
 * Union type for all possible incoming WebSocket messages
 */
type WebSocketMessage = ConnectionMessage | ShortenedUrlMessage;

/**
 * WebSocket Client for URL Shortener Service
 */
export class WebSocketClient {
  private ws: WebSocket;
  private rl: readline.Interface;
  private urls: Map<string, string> = new Map();
  private readonly wsUrl: string;
  private connected: boolean = false;

  /**
   * Creates a new WebSocket client
   * @param wsUrl - WebSocket server URL
   */
  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
    this.ws = new WebSocket(this.wsUrl);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setupEventListeners();
  }

  /**
   * Get the WebSocket instance for testing
   * @internal Used for testing only
   */
  getWebSocket(): WebSocket {
    return this.ws;
  }

  /**
   * Get the stored URLs
   * @internal Used for testing only
   */
  getStoredUrls(): Map<string, string> {
    return this.urls;
  }

  /**
   * Set up all WebSocket and readline event listeners
   */
  private setupEventListeners(): void {
    // WebSocket event listeners
    this.ws.on('open', this.handleOpen.bind(this));
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('close', this.handleClose.bind(this));
    this.ws.on('error', this.handleError.bind(this));

    // Readline event listener
    this.rl.on('line', this.handleInput.bind(this));

    // Handle process termination
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Clean up resources before exiting
   */
  private cleanup(): void {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.rl.close();
  }

  /**
   * Print a formatted message with optional dividers
   * @param title - The title of the message
   * @param message - Optional additional message content
   * @param withDivider - Whether to include dividers
   */
  private printMessage(title: string, message = '', withDivider = true): void {
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    if (withDivider) console.log(`\n${divider}`);
    if (title) console.log(` ${title}`);
    if (withDivider) console.log(divider);
    if (message) console.log(message);
  }

  /**
   * Handle WebSocket connection open event
   */
  private handleOpen(): void {
    this.connected = true;
    console.log('\n✅ Connected to WebSocket server');
    this.printMessage('WebSocket Client for URL Shortener Service');
    console.log('Waiting for messages...');
    console.log('Type "help" for available commands or "exit" to close the connection\n');
  }

  /**
   * Handle incoming WebSocket messages
   * @param data - The raw message data
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;

      // Handle connection message with client ID
      if ('type' in message && message.type === 'connection') {
        this.handleConnectionMessage(message);
        return;
      }

      // Handle shortened URL message
      if ('shortenedURL' in message) {
        this.handleShortenedUrlMessage(message);
      }
    } catch (error) {
      console.error(
        'Error parsing message:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle connection message with client ID
   * @param message - The connection message
   */
  private handleConnectionMessage(message: ConnectionMessage): void {
    const { clientId } = message.payload;
    this.printMessage(`🔑 Client ID: ${clientId}`);
    console.log('💡 Use this Client ID as the x-client-id header when making POST requests');
    console.log('   in Swagger UI at http://localhost:3000/api-docs\n');
  }

  /**
   * Handle shortened URL message
   * @param message - The shortened URL message
   */
  private handleShortenedUrlMessage(message: ShortenedUrlMessage): void {
    const shortenedURL = message.shortenedURL;
    const shortCode = shortenedURL.split('/').pop();

    if (!shortCode) {
      console.error('Error: Invalid shortened URL format');
      return;
    }

    // Store the URL for reference
    this.urls.set(shortCode, shortenedURL);

    this.printMessage(`🔗 Received Shortened URL: ${shortenedURL}`);
    console.log('💡 Test this URL by using GET /' + shortCode + ' in Swagger UI');

    // Acknowledge receipt
    const ack: AcknowledgmentMessage = {
      type: 'acknowledgment',
      payload: { shortCode },
    };

    this.ws.send(JSON.stringify(ack));
    console.log('✅ Acknowledged receipt');

    // List all received URLs
    this.showReceivedUrls();
  }

  /**
   * Display recently received URLs
   */
  private showReceivedUrls(): void {
    this.printMessage('All received URLs:', '', false);
    if (this.urls.size > 0) {
      this.urls.forEach((url, code) => {
        console.log(`- ${code}: ${url}`);
      });
    } else {
      console.log('No URLs received yet');
    }
    console.log('');
  }

  /**
   * Handle WebSocket connection close event
   */
  private handleClose(): void {
    this.connected = false;
    console.log('\n❌ Disconnected from WebSocket server');
    console.log('\nThanks for using the URL Shortener Service!');
    this.rl.close();
    process.exit(0);
  }

  /**
   * Handle WebSocket error event
   * @param error - The error object
   */
  private handleError(error: Error): void {
    console.error('\n❌ WebSocket error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the server is running at', this.wsUrl);
    }
    this.cleanup();
    process.exit(1);
  }

  /**
   * Handle user input from command line
   * @param input - User input from command line
   */
  private handleInput(input: string): void {
    const command = input.trim().toLowerCase();

    if (command) {
      const handler = this.commandHandlers[command];
      if (handler) {
        handler.call(this);
      } else {
        console.log('Unknown command. Type "help" for available commands.');
      }
    }
  }

  /**
   * Display available commands
   */
  private showHelp(): void {
    this.printMessage('WebSocket Client Commands:');
    console.log(' exit - Close the connection');
    console.log(' help - Display this help message');
    console.log(' urls - List all received URLs');
    console.log(' clear - Clear the screen');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Display all received URLs
   */
  private showUrls(): void {
    this.printMessage('Received URLs:');
    if (this.urls.size === 0) {
      console.log(' No URLs received yet');
    } else {
      this.urls.forEach((url, code) => {
        console.log(` - ${code}: ${url}`);
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Clear the console screen
   */
  private clearScreen(): void {
    process.stdout.write('\x1Bc');
    console.log('Screen cleared. Type "help" for available commands.\n');
  }

  /**
   * Exit the application
   */
  private exit(): void {
    console.log('Closing connection...');
    this.cleanup();
  }

  /**
   * Command handlers map for user input
   */
  private readonly commandHandlers: Record<string, () => void> = {
    exit: this.exit,
    help: this.showHelp,
    urls: this.showUrls,
    clear: this.clearScreen,
  };
}

// Configure the WebSocket URL and start the client
const WS_URL = process.env.WS_URL || 'ws://localhost:3000';

// Create and start the client if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`Connecting to ${WS_URL}...`);
  new WebSocketClient(WS_URL);
}
