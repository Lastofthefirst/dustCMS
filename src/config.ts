import type { Config } from './models/types';

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    baseDomain: process.env.BASE_DOMAIN || 'localhost',
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    dataDir: process.env.DATA_DIR || './data',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export const config = loadConfig();
