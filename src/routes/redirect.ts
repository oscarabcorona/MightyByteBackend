import express, { Request, Response } from 'express';
import { urlShortenerService } from '../utils/urlShortener.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Get the original URL from a short code
 *     description: Retrieves the original URL associated with the provided short code
 *     tags: [URL Shortener]
 *     parameters:
 *       - $ref: '#/components/parameters/ShortCode'
 *     responses:
 *       200:
 *         description: Original URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OriginalUrlResponse'
 *       400:
 *         description: Bad request - short code is missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: URL not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /:shortCode - Redirect to original URL
router.get('/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    if (!shortCode) {
      res.status(400).json({ error: 'Short code is required' });
      return;
    }

    const originalUrl = await urlShortenerService.getOriginalUrl(shortCode);

    if (!originalUrl) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    logger.info(`Retrieving original URL for code: ${shortCode}`);

    // Return the original URL as JSON
    res.status(200).json({ url: originalUrl });
    return;
  } catch (error) {
    logger.error('Error retrieving original URL:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as redirectRouter };
