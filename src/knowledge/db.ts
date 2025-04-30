import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../config/settings';

// 数据库连接
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/**
 * 初始化数据库连接
 * @returns 数据库连接对象
 */
export async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db; // 已经初始化
  }

  try {
    // 确保数据库目录存在
    const dbPath = config.dbPath;
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`创建数据库目录: ${dbDir}`);
    }

    // 打开数据库连接
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    logger.info(`成功连接到数据库: ${dbPath}`);

    // 启用外键约束
    await db.exec('PRAGMA foreign_keys = ON');

    // 初始化数据库表
    await initSchema();

    return db;
  } catch (error) {
    logger.error('初始化数据库失败', { error });
    throw new Error(`初始化数据库失败: ${error}`);
  }
}

/**
 * 初始化数据库表结构
 */
async function initSchema(): Promise<void> {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 执行建表SQL
    await db.exec(schema);
    logger.info('数据库表结构初始化成功');
  } catch (error) {
    logger.error('初始化数据库表结构失败', { error });
    throw new Error(`初始化数据库表结构失败: ${error}`);
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDB(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info('数据库连接已关闭');
  }
}

/**
 * 获取数据库连接
 * @returns 数据库连接对象
 */
export async function getDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!db) {
    return initDB();
  }
  return db;
}

/**
 * 执行数据库查询
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDB();
  return database.all<T[]>(sql, params);
}

/**
 * 执行数据库插入/更新/删除操作
 * @param sql SQL语句
 * @param params 查询参数
 * @returns 影响的行数
 */
export async function execute(sql: string, params: any[] = []): Promise<number> {
  const database = await getDB();
  const result = await database.run(sql, params);
  return result.changes || 0;
}

/**
 * 在事务中执行一系列SQL操作
 * @param callback 回调函数，包含要在事务中执行的SQL操作
 * @returns 回调函数的返回值
 */
export async function transaction<T>(callback: (db: Database<sqlite3.Database, sqlite3.Statement>) => Promise<T>): Promise<T> {
  const database = await getDB();
  
  try {
    await database.exec('BEGIN');
    const result = await callback(database);
    await database.exec('COMMIT');
    return result;
  } catch (error) {
    await database.exec('ROLLBACK');
    logger.error('事务执行失败', { error });
    throw error;
  }
}