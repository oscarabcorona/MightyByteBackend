# Mighty Byte Backend

A TypeScript Express server with best practices implementation.

## Features

- TypeScript for strong typing
- Express.js for API routing
- ESLint for code linting
- Prettier for code formatting
- Jest for testing
- Environment variable configuration
- Structured project layout
- Health check endpoints
- Error handling middleware
- Logging utility

## Prerequisites

- Node.js (>= 18.x)
- npm (>= 9.x)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

### Build and Run

```bash
# Build the project
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

- `GET /`: Returns a "Hello World" message
- `GET /api`: Returns API information
- `GET /api/health`: Returns health status information

## Project Structure

```
.
├── src/
│   ├── config/          # Configuration files
│   ├── routes/          # API routes
│   │   └── __tests__/   # Route tests
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry point
├── .env                 # Environment variables
├── .env.example         # Example environment variables
├── .eslintrc.json       # ESLint configuration
├── .gitignore           # Git ignore file
├── .prettierrc          # Prettier configuration
├── jest.config.js       # Jest configuration
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## License

ISC
