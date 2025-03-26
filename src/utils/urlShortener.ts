import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_FILE = path.join(__dirname, '../../data/urlMappings.json');

try {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`Created data directory at ${dataDir}`);
  }
} catch (error) {
  logger.error(`Failed to create data directory: ${error}`);
}

interface UrlMapping {
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  acknowledged: boolean;
  expiresAt?: Date;
}

class UrlShortenerService {
  private urlMappings: Map<string, UrlMapping> = new Map();
  private pendingDeliveries: Map<string, NodeJS.Timeout> = new Map();
  private readonly RETRY_INTERVAL = 5000;
  private readonly MAX_RETRIES = 5;
  private readonly URL_LIFETIME_DAYS = 30;

  constructor() {
    this.loadFromDisk();
  }

  generateShortCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    if (this.urlMappings.has(result)) {
      return this.generateShortCode();
    }

    return result;
  }

  shortenUrl(originalUrl: string, baseUrl: string): Promise<string> {
    return new Promise(resolve => {
      const shortCode = this.generateShortCode();
      const shortenedUrl = `${baseUrl}/${shortCode}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.URL_LIFETIME_DAYS);

      this.urlMappings.set(shortCode, {
        originalUrl,
        shortCode,
        createdAt: new Date(),
        acknowledged: false,
        expiresAt,
      });

      this.saveToDisk();

      logger.info(`Created shortened URL: ${shortenedUrl} for ${originalUrl}`);
      resolve(shortenedUrl);
    });
  }

  getOriginalUrl(shortCode: string): Promise<string | null> {
    return new Promise(resolve => {
      const mapping = this.urlMappings.get(shortCode);

      if (mapping) {
        if (mapping.expiresAt && new Date() > mapping.expiresAt) {
          logger.info(`URL with shortCode ${shortCode} has expired`);
          this.urlMappings.delete(shortCode);
          this.saveToDisk();
          resolve(null);
        } else {
          resolve(mapping.originalUrl);
        }
      } else {
        resolve(null);
      }
    });
  }

  acknowledgeUrl(shortCode: string): Promise<boolean> {
    return new Promise(resolve => {
      const mapping = this.urlMappings.get(shortCode);

      if (mapping) {
        mapping.acknowledged = true;
        this.urlMappings.set(shortCode, mapping);

        this.saveToDisk();

        if (this.pendingDeliveries.has(shortCode)) {
          clearTimeout(this.pendingDeliveries.get(shortCode));
          this.pendingDeliveries.delete(shortCode);
        }

        logger.info(`Shortened URL ${shortCode} acknowledged by client`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  scheduleRetry(
    shortCode: string,
    sendCallback: (shortCode: string) => void,
    retryCount = 0,
  ): void {
    if (retryCount >= this.MAX_RETRIES) {
      logger.warn(`Max retries reached for shortCode: ${shortCode}`);
      return;
    }

    const timeout = setTimeout(() => {
      const mapping = this.urlMappings.get(shortCode);

      if (mapping && !mapping.acknowledged) {
        logger.info(`Retrying delivery for shortCode: ${shortCode}, attempt: ${retryCount + 1}`);
        sendCallback(shortCode);
        this.scheduleRetry(shortCode, sendCallback, retryCount + 1);
      }

      this.pendingDeliveries.delete(shortCode);
    }, this.RETRY_INTERVAL);

    this.pendingDeliveries.set(shortCode, timeout);
  }

  private saveToDisk(): void {
    try {
      const mappingsArray = Array.from(this.urlMappings.entries()).map(([_, value]) => value);
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(mappingsArray, null, 2));
      logger.debug('URL mappings saved to disk');
    } catch (error) {
      logger.error(`Failed to save URL mappings to disk: ${error}`);
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        const mappingsArray = JSON.parse(data) as UrlMapping[];

        const now = new Date();

        for (const mapping of mappingsArray) {
          if (mapping.expiresAt && new Date(mapping.expiresAt) < now) {
            logger.info(`Skipping expired URL: ${mapping.shortCode}`);
            continue;
          }

          mapping.createdAt = new Date(mapping.createdAt);
          if (mapping.expiresAt) mapping.expiresAt = new Date(mapping.expiresAt);

          this.urlMappings.set(mapping.shortCode, mapping);
        }

        logger.info(`Loaded ${this.urlMappings.size} URL mappings from disk`);
      } else {
        logger.info('No URL mappings file found, starting with empty mappings');
      }
    } catch (error) {
      logger.error(`Failed to load URL mappings from disk: ${error}`);
    }
  }

  cleanupExpiredUrls(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [shortCode, mapping] of this.urlMappings.entries()) {
      if (mapping.expiresAt && mapping.expiresAt < now) {
        this.urlMappings.delete(shortCode);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired URLs`);
      this.saveToDisk();
    }
  }
}

export const urlShortenerService = new UrlShortenerService();
