import OpenAI from 'openai';
import { appSettings } from '../config/settings';
import { logger } from '../utils/logger';
import { ChatCompletionMessageParam } from 'openai/resources';

/**
 * OpenAI API client wrapper
 */
export class OpenAIClient {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  /**
   * Initialize OpenAI client
   */
  constructor() {
    if (!appSettings.openaiApiKey) {
      throw new Error('OpenAI API key is not set. Please set OPENAI_API_KEY environment variable or configure it in auth.json.');
    }

    this.client = new OpenAI({
      apiKey: appSettings.openaiApiKey,
    });

    this.model = appSettings.openaiModel;
    this.temperature = appSettings.openaiTemperature;
    this.maxTokens = appSettings.openaiMaxTokens;

    logger.debug(`OpenAI client initialized with model: ${this.model}`);
  }

  /**
   * Generate a completion using OpenAI API
   * @param prompt The prompt text or messages
   * @param options Optional parameters to override defaults
   * @returns The generated completion text
   */
  async complete(
    prompt: string | Array<{role: string, content: string}>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const model = options?.model || this.model;
    const temperature = options?.temperature || this.temperature;
    const maxTokens = options?.maxTokens || this.maxTokens;

    logger.debug(`Sending request to OpenAI with model: ${model}, temperature: ${temperature}`);

    try {
      let messages: ChatCompletionMessageParam[];

      if (typeof prompt === 'string') {
        messages = [{ role: 'user', content: prompt }];
      } else {
        messages = prompt.map(msg => {
          // Ensure role is correctly typed as a valid ChatCompletionMessageParam role
          const role = msg.role as 'user' | 'system' | 'assistant' | 'function' | 'tool';
          
          // For function and tool roles that require additional properties, add them conditionally
          if (role === 'function' || role === 'tool') {
            // Return a placeholder for function/tool messages - these shouldn't actually be used in this context
            // but we need to handle the type checking
            return {
              role,
              content: msg.content,
              name: 'placeholder' // Adding required 'name' property for function/tool messages
            } as ChatCompletionMessageParam;
          }
          
          return { 
            role, 
            content: msg.content 
          } as ChatCompletionMessageParam;
        });
      }

      const response = await this.client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      });

      const result = response.choices[0]?.message?.content || '';
      logger.debug(`Received response from OpenAI`);
      return result;
    } catch (error) {
      logger.error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create a singleton instance
export const openai = new OpenAIClient();