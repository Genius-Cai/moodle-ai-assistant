import axios from 'axios';
import { logger } from '../utils/logger';
import { stripHtml } from '../utils/helpers';
import { config } from '../config/settings';

/**
 * EdStem 抓取器，用于获取 EdStem 平台上的课程讨论内容
 */
export class EdStemFetcher {
  private readonly baseUrl: string;
  private token: string; // Changed from readonly to allow modification

  constructor(token?: string) {
    this.baseUrl = 'https://edstem.org/api';
    this.token = token || '';
  }

  /**
   * 设置授权令牌
   * @param token EdStem授权令牌
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 登录 EdStem 平台
   * @param email 邮箱
   * @param password 密码
   * @returns 登录成功返回true，失败返回false
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      logger.info('尝试登录 EdStem 平台');
      
      const response = await axios.post(`${this.baseUrl}/login`, {
        email,
        password
      });

      if (response.data && response.data.token) {
        this.setToken(response.data.token);
        logger.info('成功登录 EdStem 平台');
        return true;
      }

      logger.warn('登录 EdStem 平台失败: 无效响应');
      return false;
    } catch (error) {
      logger.error('登录 EdStem 平台失败', { error });
      return false;
    }
  }

  /**
   * 获取课程讨论列表
   * @param courseId EdStem课程ID
   * @returns 讨论列表
   */
  async getCourseDiscussions(courseId: string): Promise<any[]> {
    try {
      if (!this.token) {
        logger.error('获取课程讨论失败: 未设置EdStem令牌');
        return [];
      }

      logger.info(`获取 EdStem 课程讨论: ${courseId}`);
      
      const response = await axios.get(`${this.baseUrl}/courses/${courseId}/threads`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.data && response.data.threads && Array.isArray(response.data.threads)) {
        logger.info(`成功获取 EdStem 课程讨论: ${response.data.threads.length} 条`);
        return response.data.threads;
      }

      logger.warn('获取课程讨论返回无效数据');
      return [];
    } catch (error) {
      logger.error(`获取 EdStem 课程讨论失败: ${courseId}`, { error });
      return [];
    }
  }

  /**
   * 获取讨论详情及回复
   * @param courseId EdStem课程ID
   * @param threadId 讨论ID
   * @returns 讨论详情及回复
   */
  async getThreadDetails(courseId: string, threadId: string): Promise<any | null> {
    try {
      if (!this.token) {
        logger.error('获取讨论详情失败: 未设置EdStem令牌');
        return null;
      }

      logger.info(`获取 EdStem 讨论详情: ${threadId}`);
      
      const response = await axios.get(`${this.baseUrl}/courses/${courseId}/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.data && response.data.thread) {
        // 处理讨论内容，剥离HTML标签
        if (response.data.thread.document && response.data.thread.document.content) {
          response.data.thread.text = stripHtml(response.data.thread.document.content);
        }
        
        // 处理回复内容
        if (response.data.thread.comments && Array.isArray(response.data.thread.comments)) {
          for (const comment of response.data.thread.comments) {
            if (comment.document && comment.document.content) {
              comment.text = stripHtml(comment.document.content);
            }
          }
        }

        logger.info('成功获取 EdStem 讨论详情');
        return response.data.thread;
      }

      logger.warn('获取讨论详情返回无效数据');
      return null;
    } catch (error) {
      logger.error(`获取 EdStem 讨论详情失败: ${threadId}`, { error });
      return null;
    }
  }

  /**
   * 从 EdStem 获取所有讨论内容并格式化为知识库条目
   * @param courseId EdStem课程ID
   * @param moodleCourseId Moodle课程ID（用于存储）
   * @returns 格式化的知识条目数组
   */
  async getAllDiscussionsAsKnowledgeItems(courseId: string, moodleCourseId: string): Promise<any[]> {
    try {
      if (!this.token) {
        logger.error('获取讨论内容失败: 未设置EdStem令牌');
        return [];
      }
      
      // 获取所有讨论
      const discussions = await this.getCourseDiscussions(courseId);
      if (discussions.length === 0) {
        return [];
      }
      
      const knowledgeItems: any[] = [];
      
      // 处理每个讨论，获取详情及回复
      for (const discussion of discussions) {
        const threadId = discussion.id;
        const threadDetails = await this.getThreadDetails(courseId, threadId);
        
        if (threadDetails) {
          // 创建主帖的知识条目
          knowledgeItems.push({
            courseId: moodleCourseId,
            type: 'qa',
            title: threadDetails.title || '无标题讨论',
            content: threadDetails.text || stripHtml(threadDetails.document?.content || ''),
            metadata: JSON.stringify({
              author: threadDetails.user?.name || '匿名',
              created: threadDetails.createdAt,
              tags: threadDetails.tags || []
            }),
            source: 'edstem',
            sourceId: `edstem_thread_${threadId}`,
            created: new Date(threadDetails.createdAt).getTime() / 1000,
            modified: new Date(threadDetails.updatedAt).getTime() / 1000
          });
          
          // 创建回复的知识条目
          if (threadDetails.comments && Array.isArray(threadDetails.comments)) {
            for (const comment of threadDetails.comments) {
              // 过滤掉内容为空的评论
              if (!comment.text && (!comment.document || !comment.document.content)) {
                continue;
              }
              
              knowledgeItems.push({
                courseId: moodleCourseId,
                type: 'qa',
                title: `回复: ${threadDetails.title || '无标题讨论'}`,
                content: comment.text || stripHtml(comment.document?.content || ''),
                metadata: JSON.stringify({
                  author: comment.user?.name || '匿名',
                  created: comment.createdAt,
                  isAnswer: comment.isAnswer || false,
                  parentId: threadId
                }),
                source: 'edstem',
                sourceId: `edstem_comment_${comment.id}`,
                created: new Date(comment.createdAt).getTime() / 1000,
                modified: new Date(comment.updatedAt).getTime() / 1000
              });
            }
          }
        }
      }
      
      logger.info(`成功从 EdStem 获取 ${knowledgeItems.length} 条知识条目`);
      return knowledgeItems;
    } catch (error) {
      logger.error(`从 EdStem 获取知识条目失败`, { error });
      return [];
    }
  }
}