"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.appSettings = void 0;
exports.loadAuthSettings = loadAuthSettings;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
// Default settings
exports.appSettings = {
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
    dbPath: process.env.DB_PATH || path_1.default.join(__dirname, '../../knowledge/database.sqlite'),
    cacheExpiry: parseInt(process.env.CACHE_EXPIRY || '86400', 10), // Default 24 hours
    logLevel: process.env.LOG_LEVEL || 'info',
    fetchDelay: parseInt(process.env.FETCH_DELAY || '1000', 10), // Default 1 second
    fetchTimeout: parseInt(process.env.FETCH_TIMEOUT || '30000', 10), // Default 30 seconds
};
// For backwards compatibility - alias for appSettings
exports.config = exports.appSettings;
/**
 * Loads authentication settings from the auth.json file
 */
function loadAuthSettings() {
    try {
        const authPath = path_1.default.join(__dirname, 'auth.json');
        if (fs_1.default.existsSync(authPath)) {
            const authData = JSON.parse(fs_1.default.readFileSync(authPath, 'utf-8'));
            // Merge loaded settings with environment variables (env vars take precedence)
            Object.entries(authData).forEach(([key, value]) => {
                if (key in exports.appSettings && !process.env[key.toUpperCase()]) {
                    exports.appSettings[key] = value;
                }
            });
            logger_1.logger.info('Authentication settings loaded from auth.json');
        }
        else {
            logger_1.logger.warn('auth.json not found, using environment variables only');
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to load auth.json: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// Load settings on import
loadAuthSettings();
//# sourceMappingURL=settings.js.map