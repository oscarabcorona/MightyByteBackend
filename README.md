# URL Shortener Service

A Node.js service for shortening URLs with WebSocket delivery of results.

## Features

- Shortens URLs with random 10-character codes
- Delivers shortened URLs via WebSockets
- Handles client acknowledgments
- Retry mechanism for undelivered URLs
- URL expiration after 30 days
- Interactive API documentation with Swagger UI

## Installation

```bash
npm install
```

## Running the Service

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start

# For development with auto-reload
npm run dev

# Start WebSocket client (in a separate terminal)
npm run ws-client
```

## API Documentation & Testing

The service includes interactive API documentation using Swagger UI:

```
http://localhost:3000/api-docs
```

For detailed instructions on how to test the URL shortener API using Swagger UI, see [SWAGGER.md](SWAGGER.md).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
HOST=localhost
LOG_LEVEL=info
```

## Testing

This service includes comprehensive test coverage for all components and integrations:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Types

1. **Unit Tests**: Test individual components in isolation

   - URL Shortener Service
   - WebSocket Service
   - Utilities

2. **Integration Tests**: Test the interaction between components

   - API endpoints
   - WebSocket communication

3. **Client Simulation**: Simulate a client using the service
   - Complete flow from shortening to retrieval

## API Endpoints

### Shorten a URL

```
POST /url
```

**Headers:**

- `Content-Type: application/json`
- `x-client-id`: Client identifier for WebSocket communication

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

- Status: 202 Accepted
- Body: `{"message": "URL is being processed"}`

The shortened URL will be delivered via WebSocket.

### Retrieve Original URL

```
GET /:shortCode
```

**Response:**

- Status: 200 OK
- Body: `{"url": "https://example.com"}`

## WebSocket Communication

The service uses WebSockets to deliver shortened URLs to clients.

1. Connect to the WebSocket server at `ws://localhost:3000`
2. Receive a client ID in the format:

```json
{
  "type": "connection",
  "payload": {
    "clientId": "client-123456789"
  }
}
```

3. Use this client ID in the `x-client-id` header when making POST requests
4. Receive shortened URLs via WebSocket:

```json
{
  "type": "shortenedUrl",
  "payload": {
    "shortCode": "a2b345w68s",
    "shortenedURL": "http://localhost:3000/a2b345w68s"
  }
}
```

5. Acknowledge receipt by sending:

```json
{
  "type": "acknowledgment",
  "payload": {
    "shortCode": "a2b345w68s"
  }
}
```

## Configuration

Configuration is managed in `src/config/index.ts` and can be overridden with environment variables:

- `PORT`: HTTP server port (default: 3000)
- `HOST`: Server hostname (default: localhost)
- `NODE_ENV`: Environment (development, production, test)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Logs

```sh

[2025-03-26T19:02:32.444Z] [INFO] Loaded 4 URL mappings from disk
[2025-03-26T19:02:32.498Z] [INFO] Server is running at http://localhost:3000
[2025-03-26T19:02:32.498Z] [INFO] Environment: development
[2025-03-26T19:02:32.498Z] [INFO] WebSocket server initialized
[2025-03-26T19:02:45.865Z] [INFO] WebSocket client connected: client-1743015765865-467
[2025-03-26T19:03:02.153Z] [INFO] GET /api-docs/
[2025-03-26T19:03:02.169Z] [INFO] GET /api-docs/swagger-ui.css
[2025-03-26T19:03:02.170Z] [INFO] GET /api-docs/swagger-ui-init.js
[2025-03-26T19:03:02.172Z] [INFO] GET /api-docs/swagger-ui-bundle.js
[2025-03-26T19:03:02.172Z] [INFO] GET /api-docs/swagger-ui-standalone-preset.js
[2025-03-26T19:03:02.250Z] [INFO] GET /api-docs/favicon-32x32.png
[2025-03-26T19:03:47.251Z] [INFO] POST /url
[2025-03-26T19:03:47.255Z] [DEBUG] URL mappings saved to disk
[2025-03-26T19:03:47.255Z] [INFO] Created shortened URL: http://localhost:3000/eAfi1eofRr for https://classcalc.com
[2025-03-26T19:03:47.255Z] [INFO] URL shortened: https://classcalc.com -> http://localhost:3000/eAfi1eofRr for client client-1743015765865-467
[2025-03-26T19:03:47.255Z] [INFO] Sent shortened URL to client client-1743015765865-467: http://localhost:3000/eAfi1eofRr
[2025-03-26T19:03:47.257Z] [DEBUG] Received message from client-1743015765865-467: { type: 'acknowledgment', payload: { shortCode: 'eAfi1eofRr' } }
[2025-03-26T19:03:47.257Z] [DEBUG] URL mappings saved to disk
[2025-03-26T19:03:47.257Z] [INFO] Shortened URL eAfi1eofRr acknowledged by client
[2025-03-26T19:04:10.608Z] [INFO] GET /eAfi1eofRr
[2025-03-26T19:04:10.609Z] [INFO] Retrieving original URL for code: eAfi1eofRr

```
