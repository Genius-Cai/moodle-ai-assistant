import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from './db';
import { InsertParams, KnowledgeItem } from './types';
import { logger } from '../utils/logger';

/**
 * 知识库插入类 - 负责将抓取的数据插入到知识库
 */
export class KnowledgeInserter {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * 将数据插入或更新到知识库
   * @param params - 插入参数
   * @returns 插入的知识项
   */
  public async insertOrUpdate(params: InsertParams): Promise<KnowledgeItem> {
    const now = new Date().toISOString();
    
    // 生成一个基于内容的唯一 ID，使相同内容的重复抓取会更新而不是新增
    const contentHash = Buffer.from(`${params.course_id}-${params.title}-${params.type}`).toString('base64');
    const id = contentHash.slice(0, 22);
    
    try {
      const db = await this.dbManager.getDb();
      
      // 检查知识项是否已存在
      const existing = await db.get<KnowledgeItem>(
        'SELECT * FROM knowledge_items WHERE id = ?',
        id
      );
      
      const item: KnowledgeItem = {
        id,
        title: params.title,
        type: params.type,
        content: params.content,
        html_content: params.html_content,
        course_id: params.course_id,
        course_name: params.course_name,
        section_name: params.section_name,
        url: params.url,
        due_date: params.due_date,
        created_at: existing?.created_at || now,
        updated_at: now,
        metadata: params.metadata
      };
      
      // 将元数据转换为 JSON 字符串用于存储
      const metadataJson = item.metadata ? JSON.stringify(item.metadata) : null;
      
      if (existing) {
        // 更新现有条目
        await db.run(
          `UPDATE knowledge_items SET 
           title = ?, type = ?, content = ?, html_content = ?, 
           course_id = ?, course_name = ?, section_name = ?, 
           url = ?, due_date = ?, updated_at = ?, metadata = ?
           WHERE id = ?`,
          item.title,
          item.type,
          item.content,
          item.html_content,
          item.course_id,
          item.course_name,
          item.section_name,
          item.url,
          item.due_date,
          item.updated_at,
          metadataJson,
          item.id
        );
        logger.info(`Updated knowledge item: ${item.title} (${item.id})`);
      } else {
        // 插入新条目
        await db.run(
          `INSERT INTO knowledge_items (
            id, title, type, content, html_content, 
            course_id, course_name, section_name, 
            url, due_date, created_at, updated_at, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          item.title,
          item.type,
          item.content,
          item.html_content,
          item.course_id,
          item.course_name,
          item.section_name,
          item.url,
          item.due_date,
          item.created_at,
          item.updated_at,
          metadataJson
        );
        logger.info(`Inserted new knowledge item: ${item.title} (${item.id})`);
      }
      
      return item;
    } catch (error) {
      logger.error(`Failed to insert knowledge item: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 批量插入多个知识项
   * @param paramsArray - 插入参数数组
   * @returns 插入的知识项数组
   */
  public async bulkInsert(paramsArray: InsertParams[]): Promise<KnowledgeItem[]> {
    const results: KnowledgeItem[] = [];
    
    try {
      const db = await this.dbManager.getDb();
      
      // 开始事务
      await db.run('BEGIN TRANSACTION');
      
      for (const params of paramsArray) {
        const item = await this.insertOrUpdate(params);
        results.push(item);
      }
      
      // 提交事务
      await db.run('COMMIT');
      logger.info(`Bulk inserted ${results.length} knowledge items`);
      
      return results;
    } catch (error) {
      // 回滚事务
      const db = await this.dbManager.getDb();
      await db.run('ROLLBACK');
      
      logger.error(`Failed to bulk insert knowledge items: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 从知识库中删除项目
   * @param id - 要删除的项目 ID
   * @returns 删除是否成功
   */
  public async delete(id: string): Promise<boolean> {
    try {
      const db = await this.dbManager.getDb();
      const result = await db.run('DELETE FROM knowledge_items WHERE id = ?', id);
      
      if (result.changes && result.changes > 0) {
        logger.info(`Deleted knowledge item: ${id}`);
        return true;
      } else {
        logger.warn(`No knowledge item found with id: ${id}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to delete knowledge item: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 清除某门课程的所有知识项
   * @param courseId - 课程 ID
   * @returns 删除的项目数量
   */
  public async clearCourse(courseId: number): Promise<number> {
    try {
      const db = await this.dbManager.getDb();
      const result = await db.run('DELETE FROM knowledge_items WHERE course_id = ?', courseId);
      
      const deletedCount = result.changes || 0;
      logger.info(`Cleared ${deletedCount} knowledge items from course ${courseId}`);
      
      return deletedCount;
    } catch (error) {
      logger.error(`Failed to clear course knowledge: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}