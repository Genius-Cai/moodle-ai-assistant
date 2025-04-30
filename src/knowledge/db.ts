import * as sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

/**
 * 数据库管理类 - 负责处理与 SQLite 数据库的连接和初始化
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database<sqlite3.Database> | null = null;
  private dbPath: string;
  private schemaPath: string;

  private constructor() {
    // 从环境变量获取数据库路径，或使用默认值
    this.dbPath = process.env.DB_PATH || './data/knowledge.db';
    this.schemaPath = path.join(__dirname, 'schema.sql');
    
    // 确保数据库目录存在
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  /**
   * 获取 DatabaseManager 单例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库，建立连接并创建表结构
   */
  public async init(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // 如果存在 schema.sql 文件，加载并执行
      if (fs.existsSync(this.schemaPath)) {
        const schema = fs.readFileSync(this.schemaPath, 'utf8');
        await this.db.exec(schema);
        logger.info('Database schema initialized successfully');
      } else {
        logger.error(`Schema file not found: ${this.schemaPath}`);
      }
    } catch (error) {
      logger.error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取数据库连接
   */
  public async getDb(): Promise<Database<sqlite3.Database>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }
}

/**
 * Knowledge database class - Handles database operations for the knowledge base
 */
export class KnowledgeDatabase {
  private dbManager: DatabaseManager;
  private dbPath: string = ''; // Initialize with empty string to fix the error

  /**
   * Initialize the knowledge database
   * @param dbPath Optional path to the database file
   */
  constructor(dbPath?: string) {
    if (dbPath) {
      this.dbPath = dbPath;
      // Use getInstance instead of direct constructor since it's private
      this.dbManager = DatabaseManager.getInstance();
      // Set custom path in environment if needed
      process.env.DB_PATH = dbPath;
    } else {
      // Otherwise use the singleton instance
      this.dbManager = DatabaseManager.getInstance();
    }
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    await this.dbManager.init();
    logger.info('Knowledge database initialized');
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.dbManager.close();
  }

  /**
   * Get the database connection
   */
  async getDb(): Promise<Database<sqlite3.Database>> {
    return await this.dbManager.getDb();
  }
}