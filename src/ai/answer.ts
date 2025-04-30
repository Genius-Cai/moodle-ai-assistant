import { KnowledgeQuery, KnowledgeSearchResult } from '../knowledge/query';
import { OpenAIClient, ChatMessage } from './openaiClient';
import { 
  generateSystemPrompt, 
  generateUserPrompt, 
  formatKnowledgeContext,
  generateSummaryPrompt,
  generateAssignmentGuidancePrompt
} from './promptTemplates';
import { logger } from '../utils/logger';

export interface AnswerResponse {
  answer: string;
  sources: KnowledgeSearchResult[];
  isDirectMatch: boolean;
}

export class AnswerEngine {
  private openai: OpenAIClient;
  private knowledgeQuery: KnowledgeQuery;

  constructor(openaiApiKey: string, knowledgeQuery: KnowledgeQuery) {
    this.openai = new OpenAIClient(openaiApiKey);
    this.knowledgeQuery = knowledgeQuery;
  }

  /**
   * 使用知识库获取问题的答案
   * @param question 用户的问题
   * @param courseId 可选的课程ID以限定搜索范围
   * @returns 带有来源的答案
   */
  async getAnswer(question: string, courseId?: string): Promise<AnswerResponse> {
    logger.info(`回答问题: "${question}"${courseId ? ` 课程ID ${courseId}` : ''}`);
    
    // 在知识库中搜索相关信息
    const results = await this.knowledgeQuery.search(question, courseId, 10);
    
    // 如果没有找到任何内容则返回"无信息"
    if (results.length === 0) {
      logger.warn('在知识库中未找到相关信息');
      return {
        answer: "我在知识库中没有找到相关信息。",
        sources: [],
        isDirectMatch: false
      };
    }

    // 检查是否有相关度很高的直接匹配
    const directMatch = results.find(r => r.relevance > 15);
    if (directMatch) {
      logger.info('找到高相关度的直接匹配');
      return {
        answer: directMatch.content,
        sources: [directMatch],
        isDirectMatch: true
      };
    }

    // 从搜索结果为GPT格式化上下文
    const context = formatKnowledgeContext(results);
    
    // 使用GPT生成回复
    const messages: ChatMessage[] = [
      generateSystemPrompt(),
      generateUserPrompt(question, context)
    ];
    
    const answer = await this.openai.generateChatCompletion(messages);
    
    // 返回AI生成的答案和来源
    return {
      answer,
      sources: results,
      isDirectMatch: false
    };
  }

  /**
   * 生成最近课程公告的摘要
   * @param courseId 课程ID
   * @param limit 要总结的最大公告数
   * @returns 摘要文本
   */
  async summarizeAnnouncements(courseId: string, courseName: string, limit: number = 10): Promise<string> {
    logger.info(`为课程 ${courseId} 生成公告摘要`);
    
    // 获取课程的最近公告
    const results = await this.knowledgeQuery.search('announcement', courseId, limit);
    
    if (results.length === 0) {
      return "未找到此课程的最近公告。";
    }
    
    // 只包含公告
    const announcements = results.filter(r => r.source === 'announcement' || r.title?.toLowerCase().includes('announce'));
    
    if (announcements.length === 0) {
      return "未找到此课程的最近公告。";
    }
    
    // 为AI格式化公告
    const context = formatKnowledgeContext(announcements);
    
    // 生成摘要
    const messages = generateSummaryPrompt(courseName, context);
    const summary = await this.openai.generateChatCompletion(messages);
    
    return summary;
  }
  
  /**
   * 获取特定作业的指导
   * @param courseId 课程ID
   * @param assignmentName 作业名称
   * @returns 指导文本
   */
  async getAssignmentGuidance(courseId: string, assignmentName: string): Promise<AnswerResponse> {
    logger.info(`获取课程 ${courseId} 中作业 "${assignmentName}" 的指导`);
    
    // 搜索有关作业的信息
    const searchTerms = `assignment "${assignmentName}" requirements criteria rubric`;
    const results = await this.knowledgeQuery.search(searchTerms, courseId, 15);
    
    if (results.length === 0) {
      return {
        answer: `我在知识库中没有找到关于作业 "${assignmentName}" 的信息。`,
        sources: [],
        isDirectMatch: false
      };
    }
    
    // 为GPT格式化上下文
    const context = formatKnowledgeContext(results);
    
    // 生成作业指导
    const messages = generateAssignmentGuidancePrompt(assignmentName, context);
    const guidance = await this.openai.generateChatCompletion(messages);
    
    return {
      answer: guidance,
      sources: results,
      isDirectMatch: false
    };
  }
}