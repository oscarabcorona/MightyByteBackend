# Testing the URL Shortener API with Swagger

This guide explains how to use Swagger UI to test the URL shortener API with WebSocket integration.

## Prerequisites

- Node.js installed
- Project dependencies installed (`npm install`)

## Getting Started

1. **Start the server**:

   ```bash
   # Build the TypeScript code first
   npm run build

   # Start the server
   npm start

   # For development with auto-reload
   npm run dev
   ```

2. **Start the WebSocket client** (in a separate terminal):

   ```bash
   npm run ws-client
   ```

3. **Open Swagger UI in your browser**:
   ```
   http://localhost:3000/api-docs
   ```

## Testing Flow

### Step 1: Connect the WebSocket Client

The WebSocket client will connect and display a Client ID that you need for API requests:

```
🔑 Client ID: client-1234567890
```

Make note of this Client ID as you'll need it for the next step.

### Step 2: Shorten a URL

1. In Swagger UI, expand the `POST /url` endpoint
2. Click "Try it out"
3. Enter your URL in the request body:
   ```json
   {
     "url": "https://example.com"
   }
   ```
4. Add the Client ID in the `x-client-id` header field
5. Click "Execute"

You should receive a `202 Accepted` response with:

```json
{
  "message": "URL is being processed"
}
```

### Step 3: Receive the Shortened URL

Check the WebSocket client terminal. You should see the shortened URL appear:

```
🔗 Received Shortened URL: http://localhost:3000/a2b345w68s
```

The client automatically acknowledges receipt of the URL.

### Step 4: Retrieve the Original URL

1. In Swagger UI, expand the `GET /{shortCode}` endpoint
2. Click "Try it out"
3. Enter the short code (e.g., `a2b345w68s`) in the shortCode parameter field
4. Click "Execute"

You should receive a `200 OK` response with:

```json
{
  "url": "https://example.com"
}
```

## Additional Endpoints

- **GET /health**: Check the health of the API server
- **GET /api-docs/json**: Get the Swagger specification in JSON format

## WebSocket Client Commands

In the WebSocket client terminal, you can use these commands:

- `help`: Display available commands
- `urls`: List all received shortened URLs
- `exit`: Close the WebSocket connection

## Alternative: Testing with cURL

You can also test using cURL commands:

1. Start the WebSocket client and note your client ID

2. Create a shortened URL:

   ```
   curl -X POST -H "Content-Type: application/json" -H "x-client-id: YOUR_CLIENT_ID" -d '{"url":"https://www.example.com"}' http://localhost:3000/url
   ```

3. Check the WebSocket client for the shortened URL

4. Test the shortened URL:
   ```
   curl -v http://localhost:3000/YOUR_SHORT_CODE
   ```
5. You should receive the original URL in the response

## Troubleshooting

1. **Client ID not recognized**:
   Make sure you're using the correct Client ID displayed in the WebSocket client terminal.

2. **WebSocket client can't connect**:
   Ensure the server is running and listening on the correct port.

3. **Invalid URL error**:
   URLs must include the protocol (http:// or https://) and be properly formatted.

4. **Short code not found**:
   Check that you're using the correct short code from the WebSocket client output.

5. **Client ID changes**:
   If you restart the WebSocket client, you'll get a new Client ID. Always use the most recent one.
