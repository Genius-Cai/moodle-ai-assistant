import { query, getDB } from './db';
import { logger } from '../utils/logger';
import { stripHtml } from '../utils/helpers';

export interface KnowledgeSearchResult {
  id: number;
  courseId: string;
  type: string;
  title: string;
  content: string;
  source: string;
  sourceId: string;
  created: number;
  modified: number;
  relevance: number;
}

/**
 * 知识库搜索功能封装
 */
export class KnowledgeQuery {
  /**
   * 根据关键词搜索知识库
   * @param keywords 搜索关键词
   * @param courseId 可选的课程ID过滤
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  async search(keywords: string, courseId?: string, limit: number = 10): Promise<KnowledgeSearchResult[]> {
    try {
      logger.info(`搜索知识库: "${keywords}"${courseId ? ` 在课程 ${courseId}` : ''}`);

      // 准备搜索条件
      const searchTerms = keywords
        .replace(/"/g, '') // 移除双引号，避免SQL注入
        .replace(/'/g, '') // 移除单引号
        .trim();
      
      if (!searchTerms) {
        logger.warn('搜索词为空');
        return [];
      }
      
      // 构建SQL查询
      const params = [];
      let sql = `
        SELECT 
          id,
          course_id as courseId,
          type,
          title,
          content,
          source,
          source_id as sourceId,
          created,
          modified,
          rank as relevance
        FROM knowledge_fts
      `;

      // 使用FTS5全文搜索
      sql += ` WHERE knowledge_fts MATCH ?`;
      params.push(searchTerms);
      
      // 应用课程过滤
      if (courseId) {
        sql += ` AND course_id = ?`;
        params.push(courseId);
      }

      // 限制结果数量并按匹配度排序
      sql += ` ORDER BY rank LIMIT ?`;
      params.push(limit);

      // 执行查询
      const results = await query<KnowledgeSearchResult>(sql, params);
      
      logger.info(`搜索结果: ${results.length} 项`);
      return results;
    } catch (error) {
      logger.error(`搜索知识库失败: ${error}`);
      return [];
    }
  }

  /**
   * 按类型和课程获取最近的知识条目
   * @param type 条目类型
   * @param courseId 课程ID
   * @param limit 结果数量限制
   * @returns 知识条目
   */
  async getRecentByType(type: string, courseId: string, limit: number = 10): Promise<KnowledgeSearchResult[]> {
    try {
      const sql = `
        SELECT
          id,
          course_id as courseId,
          type,
          title,
          content,
          source,
          source_id as sourceId,
          created,
          modified,
          0 as relevance
        FROM knowledge_items
        WHERE type = ? AND course_id = ?
        ORDER BY created DESC
        LIMIT ?
      `;
      
      const results = await query<KnowledgeSearchResult>(sql, [type, courseId, limit.toString()]);
      
      logger.info(`获取最近${type}条目: ${results.length} 项`);
      return results;
    } catch (error) {
      logger.error(`获取最近条目失败: ${error}`);
      return [];
    }
  }

  /**
   * 获取知识条目详情
   * @param id 知识条目ID
   * @returns 知识条目详情
   */
  async getById(id: number): Promise<KnowledgeSearchResult | null> {
    try {
      const sql = `
        SELECT
          id,
          course_id as courseId,
          type,
          title,
          content,
          source,
          source_id as sourceId,
          created,
          modified,
          0 as relevance
        FROM knowledge_items
        WHERE id = ?
      `;
      
      const results = await query<KnowledgeSearchResult>(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      logger.error(`获取知识条目失败: ${error}`);
      return null;
    }
  }
}