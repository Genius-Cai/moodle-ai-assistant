import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { config } from '../config/settings';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 管理与 OpenAI API 的交互
 */
export class OpenAIClient {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string = config.openai.apiKey, model: string = config.openai.model) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    this.model = model || 'gpt-4';
    logger.info(`OpenAI 客户端初始化完成，使用模型: ${this.model}`);
  }

  /**
   * 生成聊天完成
   * @param messages 消息数组，包含系统、用户和助手的消息
   * @returns 生成的文本
   */
  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      logger.info('发送请求到 OpenAI API');
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const responseText = response.choices[0]?.message?.content || '';
      logger.info('成功收到 OpenAI API 响应');
      
      return responseText;
    } catch (error) {
      logger.error('OpenAI API 请求失败', { error });
      throw new Error(`OpenAI API 请求失败: ${error}`);
    }
  }

  /**
   * 创建嵌入向量
   * @param text 要嵌入的文本
   * @returns 嵌入向量
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('创建嵌入向量失败', { error });
      throw new Error(`创建嵌入向量失败: ${error}`);
    }
  }
}