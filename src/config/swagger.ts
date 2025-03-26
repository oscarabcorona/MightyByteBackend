import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'URL Shortener API',
    version: '1.0.0',
    description: 'URL Shortener Service with WebSocket Support',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `http://${config.host}:${config.port}`,
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      ShortenUrlRequest: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            description: 'The URL to shorten',
            example: 'https://example.com',
          },
        },
      },
      ShortenUrlResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Response message',
            example: 'URL is being processed',
          },
        },
      },
      OriginalUrlResponse: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The original URL',
            example: 'https://example.com',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Client ID is required in the x-client-id header',
          },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                  example: 'Please provide a valid URL with http or https protocol',
                },
                param: {
                  type: 'string',
                  example: 'url',
                },
                location: {
                  type: 'string',
                  example: 'body',
                },
              },
            },
          },
        },
      },
    },
    parameters: {
      ClientIdHeader: {
        in: 'header',
        name: 'x-client-id',
        schema: {
          type: 'string',
        },
        required: true,
        description: 'Client ID for WebSocket communication',
        example: 'client-1234567890',
      },
      ShortCode: {
        in: 'path',
        name: 'shortCode',
        schema: {
          type: 'string',
        },
        required: true,
        description: 'The short code for a shortened URL',
        example: 'a2b345w68s',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationErrorResponse',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'URL Shortener',
      description: 'URL shortening endpoints',
    },
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
