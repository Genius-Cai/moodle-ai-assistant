"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeQuery = void 0;
const db_1 = require("./db");
const logger_1 = require("../utils/logger");
/**
 * 知识库查询类 - 负责从知识库中检索相关内容
 */
class KnowledgeQuery {
    constructor() {
        this.dbManager = db_1.DatabaseManager.getInstance();
    }
    /**
     * 查询知识库中的内容
     * @param params - 查询参数
     * @returns 匹配的知识项数组
     */
    async query(params) {
        try {
            const db = await this.dbManager.getDb();
            // 准备查询条件
            const conditions = [];
            const queryParams = [];
            // 添加全文搜索条件
            if (params.query) {
                conditions.push('knowledge_fts MATCH ?');
                // 为提高匹配效果，对查询进行预处理，添加通配符
                const searchTerms = params.query
                    .split(/\s+/)
                    .filter(term => term.length > 2) // 过滤掉太短的词
                    .map(term => `${term}*`) // 添加通配符以进行前缀匹配
                    .join(' OR ');
                queryParams.push(searchTerms || params.query); // 如果没有有效搜索词，则使用原始查询
            }
            // 添加课程 ID 过滤条件
            if (params.courseId !== undefined) {
                conditions.push('items.course_id = ?');
                queryParams.push(params.courseId);
            }
            // 添加类型过滤条件
            if (params.type !== undefined) {
                conditions.push('items.type = ?');
                queryParams.push(params.type);
            }
            // 构建完整查询语句
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const limitClause = params.limit ? `LIMIT ${params.limit}` : 'LIMIT 10';
            // 执行查询，获取匹配项及其评分
            const query = `
        SELECT 
          items.*,
          highlight(knowledge_fts, 2, '<mark>', '</mark>') as highlighted_content,
          rank * 100 as score
        FROM 
          knowledge_fts AS fts
        JOIN 
          knowledge_items AS items ON fts.rowid = items.rowid
        ${whereClause}
        ORDER BY score DESC
        ${limitClause}
      `;
            const results = await db.all(query, ...queryParams);
            // 处理匹配结果，提取匹配词
            const matchResults = results.map((row) => {
                // 提取被高亮显示的匹配词
                const matchedTermsSet = new Set();
                const highlighted = row.highlighted_content || '';
                const matches = highlighted.match(/<mark>(.*?)<\/mark>/g) || [];
                matches.forEach((match) => {
                    const term = match.replace(/<mark>|<\/mark>/g, '').toLowerCase();
                    if (term.length > 1) { // 过滤掉单字符匹配
                        matchedTermsSet.add(term);
                    }
                });
                // 处理分数和阈值
                let score = row.score || 0;
                const threshold = params.threshold || 10;
                // 如果分数太低，过滤掉
                if (score < threshold) {
                    return null;
                }
                // 如果在标题中找到匹配，提高分数
                if (params.query) {
                    const titleLower = row.title.toLowerCase();
                    const queryLower = params.query.toLowerCase();
                    if (titleLower === queryLower) {
                        score += 50; // 完全匹配标题
                    }
                    else if (titleLower.includes(queryLower)) {
                        score += 30; // 部分匹配标题
                    }
                }
                // 创建结果对象
                const item = {
                    id: row.id,
                    title: row.title,
                    type: row.type,
                    content: row.content,
                    html_content: row.html_content,
                    course_id: row.course_id,
                    course_name: row.course_name,
                    section_name: row.section_name,
                    url: row.url,
                    due_date: row.due_date,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
                };
                return {
                    item,
                    score,
                    matched_terms: Array.from(matchedTermsSet)
                };
            }).filter(Boolean); // 过滤掉空结果
            logger_1.logger.info(`Query "${params.query}" returned ${matchResults.length} results`);
            return matchResults;
        }
        catch (error) {
            logger_1.logger.error(`Failed to query knowledge base: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取特定 ID 的知识项
     * @param id - 知识项 ID
     * @returns 知识项或 null
     */
    async getById(id) {
        try {
            const db = await this.dbManager.getDb();
            const result = await db.get('SELECT * FROM knowledge_items WHERE id = ?', id);
            if (!result) {
                return null;
            }
            return {
                id: result.id,
                title: result.title,
                type: result.type,
                content: result.content,
                html_content: result.html_content,
                course_id: result.course_id,
                course_name: result.course_name,
                section_name: result.section_name,
                url: result.url,
                due_date: result.due_date,
                created_at: result.created_at,
                updated_at: result.updated_at,
                metadata: result.metadata ? JSON.parse(result.metadata) : undefined
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get knowledge item by ID: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取特定课程的所有知识项
     * @param courseId - 课程 ID
     * @param type - 可选，过滤特定类型的知识项
     * @returns 知识项数组
     */
    async getByCourse(courseId, type) {
        try {
            const db = await this.dbManager.getDb();
            let query = 'SELECT * FROM knowledge_items WHERE course_id = ?';
            const params = [courseId];
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }
            query += ' ORDER BY updated_at DESC';
            const results = await db.all(query, ...params);
            return results.map(row => ({
                id: row.id,
                title: row.title,
                type: row.type,
                content: row.content,
                html_content: row.html_content,
                course_id: row.course_id,
                course_name: row.course_name,
                section_name: row.section_name,
                url: row.url,
                due_date: row.due_date,
                created_at: row.created_at,
                updated_at: row.updated_at,
                metadata: row.metadata ? JSON.parse(row.metadata) : undefined
            }));
        }
        catch (error) {
            logger_1.logger.error(`Failed to get knowledge items by course: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.KnowledgeQuery = KnowledgeQuery;
//# sourceMappingURL=query.js.map