/**
 * 知识库中存储的内容类型
 */
export enum KnowledgeType {
  COURSE_INFO = 'course_info',
  ASSIGNMENT = 'assignment',
  RESOURCE = 'resource',
  ANNOUNCEMENT = 'announcement',
  FORUM_POST = 'forum_post',
  QUIZ = 'quiz',
  OTHER = 'other'
}

/**
 * 知识库中的内容项接口
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  content: string;
  html_content?: string;
  course_id: number;
  course_name: string;
  section_name?: string;
  url?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * 知识匹配结果接口
 */
export interface MatchResult {
  item: KnowledgeItem;
  score: number;
  matched_terms: string[];
}

/**
 * 查询参数接口
 */
export interface QueryParams {
  query: string;
  courseId?: number;
  type?: KnowledgeType;
  limit?: number;
  threshold?: number; // 匹配分数阈值
}

/**
 * 插入数据参数接口
 */
export interface InsertParams {
  title: string;
  type: KnowledgeType;
  content: string;
  html_content?: string;
  course_id: number;
  course_name: string;
  section_name?: string;
  url?: string;
  due_date?: string;
  metadata?: Record<string, any>;
}