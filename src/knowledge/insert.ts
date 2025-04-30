import { logger } from '../utils/logger';
import { query, execute, transaction, getDB } from './db';
import { KnowledgeItem } from '../types/api';

/**
 * 将知识条目插入到数据库中
 * @param item 知识条目
 * @returns 插入的条目ID
 */
export async function insertKnowledgeItem(item: KnowledgeItem): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // 检查是否已存在相同来源和ID的条目
    const existingItems = await query<{ id: number, modified: number }>(
      'SELECT id, modified FROM knowledge_items WHERE source = ? AND source_id = ?',
      [item.source, item.sourceId]
    );

    // 如果存在相同条目，且内容没有变化，则不更新
    if (existingItems.length > 0) {
      const existingItem = existingItems[0];
      
      // 更新现有条目
      const result = await execute(
        `UPDATE knowledge_items SET 
          title = ?, 
          content = ?, 
          metadata = ?,
          modified = ? 
        WHERE id = ?`,
        [item.title, item.content, item.metadata, now, existingItem.id]
      );

      logger.info(`更新知识条目: ${item.title} (${existingItem.id})`);
      return existingItem.id;
    }

    // 插入新条目
    const result = await execute(
      `INSERT INTO knowledge_items (
        course_id, 
        type, 
        title, 
        content, 
        metadata, 
        source, 
        source_id, 
        created, 
        modified, 
        embedding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.courseId,
        item.type,
        item.title,
        item.content,
        item.metadata,
        item.source,
        item.sourceId,
        item.created || now,
        item.modified || now,
        item.embedding || null
      ]
    );

    const db = await getDB();
    const lastId = await db.get('SELECT last_insert_rowid() as id');
    
    logger.info(`插入新知识条目: ${item.title} (${lastId.id})`);
    return lastId.id;
  } catch (error) {
    logger.error(`插入知识条目失败: ${item.title}`, { error });
    throw new Error(`插入知识条目失败: ${error}`);
  }
}

/**
 * 批量插入多个知识条目
 * @param items 知识条目数组
 * @returns 插入的条目数量
 */
export async function batchInsertKnowledgeItems(items: KnowledgeItem[]): Promise<number> {
  if (items.length === 0) {
    return 0;
  }

  // 使用事务批量插入，确保原子性
  return transaction(async (db) => {
    let successCount = 0;

    for (const item of items) {
      try {
        await insertKnowledgeItem(item);
        successCount++;
      } catch (error) {
        logger.warn(`批量插入中的条目失败: ${item.title}`, { error });
        // 继续处理其他条目
      }
    }

    logger.info(`批量插入完成: 成功 ${successCount}/${items.length} 条`);
    return successCount;
  });
}

/**
 * 从Moodle公告创建知识条目
 * @param courseId 课程ID
 * @param announcement 公告内容
 * @returns 创建的知识条目
 */
export function createAnnouncementItem(
  courseId: string, 
  announcement: { title: string, content: string, created: number, id: string }
): KnowledgeItem {
  return {
    courseId,
    type: 'announcement',
    title: announcement.title,
    content: announcement.content,
    metadata: JSON.stringify({ 
      postedDate: new Date(announcement.created * 1000).toISOString() 
    }),
    source: 'moodle',
    sourceId: announcement.id,
    created: announcement.created,
    modified: announcement.created
  };
}

/**
 * 从Moodle作业创建知识条目
 * @param courseId 课程ID
 * @param assignment 作业内容
 * @returns 创建的知识条目
 */
export function createAssignmentItem(
  courseId: string, 
  assignment: { title: string, content: string, dueDate: number, id: string }
): KnowledgeItem {
  return {
    courseId,
    type: 'assignment',
    title: assignment.title,
    content: assignment.content,
    metadata: JSON.stringify({ 
      dueDate: new Date(assignment.dueDate * 1000).toISOString() 
    }),
    source: 'moodle',
    sourceId: assignment.id,
    created: Math.floor(Date.now() / 1000),
    modified: Math.floor(Date.now() / 1000)
  };
}

/**
 * 从Moodle内容批量创建知识条目并插入数据库
 * @param courseId 课程ID
 * @param content Moodle课程内容
 * @returns 插入的条目数量
 */
export async function insertMoodleContent(
  courseId: string,
  content: {
    announcements: Array<{ title: string, content: string, created: number, id: string }>,
    assignments: Array<{ title: string, content: string, dueDate: number, id: string }>
  }
): Promise<number> {
  const items: KnowledgeItem[] = [];

  // 处理公告
  for (const announcement of content.announcements) {
    items.push(createAnnouncementItem(courseId, announcement));
  }

  // 处理作业
  for (const assignment of content.assignments) {
    items.push(createAssignmentItem(courseId, assignment));
  }

  // 批量插入
  return batchInsertKnowledgeItems(items);
}