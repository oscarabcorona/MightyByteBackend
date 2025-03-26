import fs from 'fs';
import path from 'path';
import { urlShortenerService } from '../urlShortener.js';
import { jest } from '@jest/globals';

beforeEach(() => {
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'mkdirSync').mockImplementation(path => undefined);

  jest.clearAllMocks();
});

describe('URL Shortener Service', () => {
  const baseUrl = 'http://localhost:3000';
  const originalUrl = 'https://example.com';

  describe('shortenUrl', () => {
    it('should generate a shortened URL', async () => {
      const shortenedUrl = await urlShortenerService.shortenUrl(originalUrl, baseUrl);

      expect(shortenedUrl).toMatch(new RegExp(`^${baseUrl}/[A-Za-z0-9]{10}$`));
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should ensure unique short codes', async () => {
      const generateShortCodeSpy = jest.spyOn(urlShortenerService as any, 'generateShortCode');

      const firstCode = 'abcde12345';
      generateShortCodeSpy.mockReturnValueOnce(firstCode);

      const firstUrl = await urlShortenerService.shortenUrl(originalUrl, baseUrl);
      expect(firstUrl).toBe(`${baseUrl}/${firstCode}`);

      generateShortCodeSpy.mockReturnValueOnce(firstCode).mockReturnValueOnce('fghij67890');

      const mapGetSpy = jest.spyOn(Map.prototype, 'get');
      mapGetSpy.mockReturnValueOnce({
        originalUrl,
        shortCode: firstCode,
        createdAt: new Date(),
        acknowledged: false,
      });

      const secondUrl = await urlShortenerService.shortenUrl(
        'https://another-example.com',
        baseUrl,
      );

      expect(secondUrl).not.toBe(firstUrl);
      expect(generateShortCodeSpy).toHaveBeenCalledTimes(3);

      generateShortCodeSpy.mockRestore();
      mapGetSpy.mockRestore();
    });
  });

  describe('getOriginalUrl', () => {
    it('should retrieve the original URL by short code', async () => {
      const shortCode = 'abcde12345';

      const mapGetSpy = jest.spyOn(Map.prototype, 'get');
      mapGetSpy.mockReturnValueOnce({
        originalUrl,
        shortCode,
        createdAt: new Date(),
        acknowledged: false,
      });

      const retrievedUrl = await urlShortenerService.getOriginalUrl(shortCode);

      expect(retrievedUrl).toBe(originalUrl);
      expect(mapGetSpy).toHaveBeenCalledWith(shortCode);

      mapGetSpy.mockRestore();
    });

    it('should return null for non-existent short code', async () => {
      const shortCode = 'nonexistent';

      const retrievedUrl = await urlShortenerService.getOriginalUrl(shortCode);

      expect(retrievedUrl).toBeNull();
    });

    it('should return null and delete expired URLs', async () => {
      const shortCode = 'expired12345';

      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 31);

      const mapGetSpy = jest.spyOn(Map.prototype, 'get');
      mapGetSpy.mockReturnValueOnce({
        originalUrl,
        shortCode,
        createdAt: expiredDate,
        acknowledged: false,
        expiresAt: expiredDate,
      });

      const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

      const retrievedUrl = await urlShortenerService.getOriginalUrl(shortCode);

      expect(retrievedUrl).toBeNull();
      expect(mapDeleteSpy).toHaveBeenCalledWith(shortCode);
      expect(fs.writeFileSync).toHaveBeenCalled();

      mapGetSpy.mockRestore();
      mapDeleteSpy.mockRestore();
    });
  });

  describe('acknowledgeUrl', () => {
    it('should mark a URL as acknowledged', async () => {
      const shortCode = 'abcde12345';
      const mapping = {
        originalUrl,
        shortCode,
        createdAt: new Date(),
        acknowledged: false,
      };

      const mapGetSpy = jest.spyOn(Map.prototype, 'get');
      mapGetSpy.mockReturnValueOnce(mapping);

      const mapSetSpy = jest.spyOn(Map.prototype, 'set');

      const result = await urlShortenerService.acknowledgeUrl(shortCode);

      expect(result).toBe(true);
      expect(mapping.acknowledged).toBe(true);
      expect(mapSetSpy).toHaveBeenCalledWith(shortCode, mapping);
      expect(fs.writeFileSync).toHaveBeenCalled();

      mapGetSpy.mockRestore();
      mapSetSpy.mockRestore();
    });

    it('should return false for non-existent short code', async () => {
      const shortCode = 'nonexistent';

      const result = await urlShortenerService.acknowledgeUrl(shortCode);

      expect(result).toBe(false);
    });
  });

  describe('scheduleRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule retries for unacknowledged URLs', () => {
      const shortCode = 'abcde12345';
      const sendCallback = jest.fn();

      const mapGetSpy = jest.spyOn(Map.prototype, 'get');
      mapGetSpy.mockReturnValue({
        originalUrl,
        shortCode,
        createdAt: new Date(),
        acknowledged: false,
      });

      urlShortenerService.scheduleRetry(shortCode, sendCallback);

      jest.runAllTimers();

      expect(sendCallback).toHaveBeenCalledWith(shortCode);

      mapGetSpy.mockRestore();
    });

    it('should not retry after max retries is reached', () => {
      const shortCode = 'abcde12345';
      const sendCallback = jest.fn();
      const maxRetries = (urlShortenerService as any).MAX_RETRIES;

      urlShortenerService.scheduleRetry(shortCode, sendCallback, maxRetries);

      expect(sendCallback).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredUrls', () => {
    it('should delete expired URLs', () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 31);

      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 5);

      const entriesArray = [
        ['expired1', { shortCode: 'expired1', expiresAt: expiredDate }],
        ['expired2', { shortCode: 'expired2', expiresAt: expiredDate }],
        ['current', { shortCode: 'current', expiresAt: currentDate }],
      ];

      const mapEntriesSpy = jest.spyOn(Map.prototype, 'entries');
      mapEntriesSpy.mockReturnValueOnce(entriesArray as any);

      const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

      urlShortenerService.cleanupExpiredUrls();

      expect(mapDeleteSpy).toHaveBeenCalledTimes(2);
      expect(mapDeleteSpy).toHaveBeenCalledWith('expired1');
      expect(mapDeleteSpy).toHaveBeenCalledWith('expired2');
      expect(fs.writeFileSync).toHaveBeenCalled();

      mapEntriesSpy.mockRestore();
      mapDeleteSpy.mockRestore();
    });
  });
});
