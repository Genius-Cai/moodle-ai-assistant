-- 知识库架构定义
-- 用于存储 Moodle 课程内容的 SQLite 数据库结构

-- 知识项表，存储所有抓取的内容
CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,  -- 唯一标识符
  title TEXT NOT NULL,  -- 内容标题
  type TEXT NOT NULL,   -- 内容类型 (course_info, assignment, resource, announcement, forum_post, quiz, other)
  content TEXT NOT NULL, -- 内容文本
  html_content TEXT,    -- HTML 格式内容（如果有）
  course_id INTEGER NOT NULL,  -- 课程 ID
  course_name TEXT NOT NULL,   -- 课程名称
  section_name TEXT,    -- 所属章节名称
  url TEXT,             -- 原始 URL（如果适用）
  due_date TEXT,        -- 截止日期（如果适用）
  created_at TEXT NOT NULL,  -- 创建时间
  updated_at TEXT NOT NULL,  -- 更新时间
  metadata TEXT         -- 额外元数据 JSON 字符串
);

-- 全文搜索索引
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
  id,
  title,
  content,
  section_name,
  content='knowledge_items',
  content_rowid='rowid'
);

-- 触发器：添加新记录到 FTS 表
CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(rowid, id, title, content, section_name)
  VALUES (new.rowid, new.id, new.title, new.content, new.section_name);
END;

-- 触发器：更新 FTS 表中的记录
CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, id, title, content, section_name)
  VALUES ('delete', old.rowid, old.id, old.title, old.content, old.section_name);
  INSERT INTO knowledge_fts(rowid, id, title, content, section_name)
  VALUES (new.rowid, new.id, new.title, new.content, new.section_name);
END;

-- 触发器：删除 FTS 表中的记录
CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, id, title, content, section_name)
  VALUES ('delete', old.rowid, old.id, old.title, old.content, old.section_name);
END;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_course ON knowledge_items(course_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_items(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_updated ON knowledge_items(updated_at);