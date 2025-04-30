-- 知识库表结构
-- 存储从Moodle和其他平台抓取的内容

-- 删除已存在的表（谨慎使用）
DROP TABLE IF EXISTS knowledge_items;

-- 创建知识条目表
CREATE TABLE knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL,           -- 课程ID
  type TEXT NOT NULL,                -- 类型：announcement, assignment, qa, resource
  title TEXT NOT NULL,               -- 标题
  content TEXT NOT NULL,             -- 内容
  metadata TEXT,                     -- 元数据，JSON格式
  source TEXT NOT NULL,              -- 来源，例如 "moodle", "edstem"
  source_id TEXT NOT NULL,           -- 来源系统中的ID
  created INTEGER NOT NULL,          -- 创建时间戳
  modified INTEGER NOT NULL,         -- 修改时间戳
  embedding TEXT                     -- 向量嵌入，用于语义搜索（可选）
);

-- 创建索引
CREATE INDEX idx_knowledge_course_id ON knowledge_items(course_id);
CREATE INDEX idx_knowledge_type ON knowledge_items(type);
CREATE INDEX idx_knowledge_source ON knowledge_items(source);
CREATE INDEX idx_knowledge_source_id ON knowledge_items(source_id);
CREATE UNIQUE INDEX idx_knowledge_source_source_id ON knowledge_items(source, source_id);

-- 全文搜索索引
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
  title, 
  content, 
  content='knowledge_items', 
  content_rowid='id'
);

-- 创建触发器，自动更新全文搜索索引
CREATE TRIGGER IF NOT EXISTS knowledge_items_ai AFTER INSERT ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_items_ad AFTER DELETE ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_items_au AFTER UPDATE ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO knowledge_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;