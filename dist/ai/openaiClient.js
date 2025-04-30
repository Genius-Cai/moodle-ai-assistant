"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const settings_1 = require("../config/settings");
const logger_1 = require("../utils/logger");
/**
 * OpenAI API client wrapper
 */
class OpenAIClient {
    /**
     * Initialize OpenAI client
     */
    constructor() {
        if (!settings_1.appSettings.openaiApiKey) {
            throw new Error('OpenAI API key is not set. Please set OPENAI_API_KEY environment variable or configure it in auth.json.');
        }
        this.client = new openai_1.default({
            apiKey: settings_1.appSettings.openaiApiKey,
        });
        this.model = settings_1.appSettings.openaiModel;
        this.temperature = settings_1.appSettings.openaiTemperature;
        this.maxTokens = settings_1.appSettings.openaiMaxTokens;
        logger_1.logger.debug(`OpenAI client initialized with model: ${this.model}`);
    }
    /**
     * Generate a completion using OpenAI API
     * @param prompt The prompt text or messages
     * @param options Optional parameters to override defaults
     * @returns The generated completion text
     */
    async complete(prompt, options) {
        const model = options?.model || this.model;
        const temperature = options?.temperature || this.temperature;
        const maxTokens = options?.maxTokens || this.maxTokens;
        logger_1.logger.debug(`Sending request to OpenAI with model: ${model}, temperature: ${temperature}`);
        try {
            let messages;
            if (typeof prompt === 'string') {
                messages = [{ role: 'user', content: prompt }];
            }
            else {
                messages = prompt.map(msg => {
                    // Ensure role is correctly typed as a valid ChatCompletionMessageParam role
                    const role = msg.role;
                    // For function and tool roles that require additional properties, add them conditionally
                    if (role === 'function' || role === 'tool') {
                        // Return a placeholder for function/tool messages - these shouldn't actually be used in this context
                        // but we need to handle the type checking
                        return {
                            role,
                            content: msg.content,
                            name: 'placeholder' // Adding required 'name' property for function/tool messages
                        };
                    }
                    return {
                        role,
                        content: msg.content
                    };
                });
            }
            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
            });
            const result = response.choices[0]?.message?.content || '';
            logger_1.logger.debug(`Received response from OpenAI`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.OpenAIClient = OpenAIClient;
// Create a singleton instance
exports.openai = new OpenAIClient();
//# sourceMappingURL=openaiClient.js.map