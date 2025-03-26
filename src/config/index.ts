import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  host: string;
  environment: string;
  logLevel: string;
}

const getPort = (): number => {
  if (process.env.NODE_ENV === 'test') {
    return 0;
  }
  const parsedPort = parseInt(process.env.PORT || '3000', 10);
  return isNaN(parsedPort) ? 3000 : parsedPort;
};

export const config: Config = {
  port: getPort(),
  host: process.env.HOST || 'localhost',
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};
