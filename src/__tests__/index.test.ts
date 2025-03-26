import { describe, expect, jest, it } from '@jest/globals';

// Mock the modules we depend on
jest.mock('../app.js', () => {
  return {
    app: {
      listen: jest.fn(() => ({
        close: jest.fn((cb?: () => void) => cb && cb()),
      })),
    },
  };
});

jest.mock('../config/index.js', () => {
  return {
    config: {
      port: 3000,
      host: 'localhost',
      environment: 'test',
    },
  };
});

jest.mock('../utils/logger.js', () => {
  return {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };
});

// Import the modules we want to test
import { app } from '../app.js';
import { logger } from '../utils/logger.js';
import { startServer, createServer } from '../index.js';

// Mock safeExit to prevent process.exit in tests
jest.mock('../index.js', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = jest.requireActual('../index.js');
  return {
    __esModule: true,
    startServer: actual.startServer,
    createServer: actual.createServer,
    safeExit: jest.fn(),
    default: actual.default,
  };
});

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start and create server', () => {
    // Test that createServer configures a server correctly
    createServer();

    // Verify app.listen was called
    expect(app.listen).toHaveBeenCalled();

    // Verify logger was called with expected message
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Server is running'));
  });

  it('should handle errors', () => {
    // Make app.listen throw an error for this test
    (app.listen as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Server error');
    });

    startServer();

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to start server:'),
      expect.any(Error),
    );
  });
});
