# URL Shortener Service Todo

✅ - Implement POST `/url` endpoint to receive URLs for shortening
✅ - Generate random 10-character alphanumeric codes
✅ - Create shortened URLs by combining server base URL with generated code
✅ - Store URL mappings without using a database (in-memory with async operations)
✅ - Implement alternative protocol to return shortened URLs to clients (not HTTP response)
✅ - Add acknowledgment mechanism for clients to confirm receipt
✅ - Implement retry logic for delivering shortened URLs when client acknowledgment fails
✅ - Create GET endpoint that returns original URL when shortened URL is accessed

## Extra Features Implemented

- WebSocket service for real-time communication with clients
- Persistent storage of URL mappings in JSON file
- URL expiration after 30 days
- Scheduled cleanup for expired URLs
- API documentation with Swagger
- Client ID-based authentication via headers
- Rate limiting for URL shortening requests
- Health check endpoint
- Graceful server shutdown
- Detailed logging system
- Error handling and validation for URL inputs
