import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { urlShortenerService } from '../utils/urlShortener.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { rateLimiter } from '../utils/rateLimiter.js';

const router = express.Router();

const validateUrl = [
  body('url')
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      require_host: true,
      allow_underscores: true,
    })
    .withMessage('Please provide a valid URL with http or https protocol')
    .not()
    .isEmpty()
    .withMessage('URL is required')
    .isLength({ max: 2048 })
    .withMessage('URL is too long (max 2048 characters)'),
];

/**
 * @swagger
 * /url:
 *   post:
 *     summary: Create a shortened URL
 *     description: |
 *       Creates a shortened URL and sends it back to the client via WebSocket.
 *       The client must have an active WebSocket connection and include the client ID in the header.
 *     tags: [URL Shortener]
 *     parameters:
 *       - $ref: '#/components/parameters/ClientIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShortenUrlRequest'
 *     responses:
 *       202:
 *         description: URL is being processed. The shortened URL will be sent via WebSocket.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenUrlResponse'
 *       400:
 *         description: Bad request - invalid URL or missing client ID
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /url - Create a shortened URL
router.post('/', rateLimiter, validateUrl, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const originalUrl = req.body.url;
    const clientId = req.headers['x-client-id'] as string;

    if (!clientId) {
      res.status(400).json({ error: 'Client ID is required in the x-client-id header' });
      return;
    }

    const baseUrl = `http://${config.host}:${config.port}`;

    const shortenedUrl = await urlShortenerService.shortenUrl(originalUrl, baseUrl);
    const shortCode = shortenedUrl.split('/').pop() || '';

    logger.info(`URL shortened: ${originalUrl} -> ${shortenedUrl} for client ${clientId}`);

    req.app.locals.websocketService.sendShortenedUrl(clientId, shortCode, shortenedUrl);

    res.status(202).json({ message: 'URL is being processed' });
  } catch (error) {
    logger.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

export { router as urlRouter };
