import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface AppSettings {
  openaiApiKey: string;
  openaiModel: string;
  openaiTemperature: number;
  openaiMaxTokens: number;
  moodleUrl: string;
  moodleBaseUrl: string; // Added for fetcher compatibility 
  moodleToken: string;
  moodleSessionCookie: string; // Added for fetcher compatibility
  cseApiKey: string;
  cseId: string;
  allyApiKey: string;
  edstemApiKey: string;
  dbPath: string;
  cacheExpiry: number;
  logLevel: string;
  fetchDelay: number; // Added for fetcher compatibility
  fetchTimeout: number; // Added for fetcher compatibility
}

// Default settings
export const appSettings: AppSettings = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  openaiTemperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  openaiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
  moodleUrl: process.env.MOODLE_URL || '',
  moodleBaseUrl: process.env.MOODLE_BASE_URL || process.env.MOODLE_URL || '',
  moodleToken: process.env.MOODLE_TOKEN || '',
  moodleSessionCookie: process.env.MOODLE_SESSION_COOKIE || '',
  cseApiKey: process.env.CSE_API_KEY || '',
  cseId: process.env.CSE_ID || '',
  allyApiKey: process.env.ALLY_API_KEY || '',
  edstemApiKey: process.env.EDSTEM_API_KEY || '',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../knowledge/database.sqlite'),
  cacheExpiry: parseInt(process.env.CACHE_EXPIRY || '86400', 10), // Default 24 hours
  logLevel: process.env.LOG_LEVEL || 'info',
  fetchDelay: parseInt(process.env.FETCH_DELAY || '1000', 10), // Default 1 second
  fetchTimeout: parseInt(process.env.FETCH_TIMEOUT || '30000', 10), // Default 30 seconds
};

// For backwards compatibility - alias for appSettings
export const config = appSettings;

/**
 * Loads authentication settings from the auth.json file
 */
export function loadAuthSettings(): void {
  try {
    const authPath = path.join(__dirname, 'auth.json');
    
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      
      // Merge loaded settings with environment variables (env vars take precedence)
      Object.entries(authData).forEach(([key, value]) => {
        if (key in appSettings && !process.env[key.toUpperCase()]) {
          (appSettings as any)[key] = value;
        }
      });
      
      logger.info('Authentication settings loaded from auth.json');
    } else {
      logger.warn('auth.json not found, using environment variables only');
    }
  } catch (error) {
    logger.error(`Failed to load auth.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Load settings on import
loadAuthSettings();