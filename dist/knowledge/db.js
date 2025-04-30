"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeDatabase = exports.DatabaseManager = void 0;
const sqlite3 = __importStar(require("sqlite3"));
const sqlite_1 = require("sqlite");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv.config();
/**
 * 数据库管理类 - 负责处理与 SQLite 数据库的连接和初始化
 */
class DatabaseManager {
    constructor() {
        this.db = null;
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
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    /**
     * 初始化数据库，建立连接并创建表结构
     */
    async init() {
        if (this.db) {
            return;
        }
        try {
            this.db = await (0, sqlite_1.open)({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            // 启用外键约束
            await this.db.exec('PRAGMA foreign_keys = ON');
            // 如果存在 schema.sql 文件，加载并执行
            if (fs.existsSync(this.schemaPath)) {
                const schema = fs.readFileSync(this.schemaPath, 'utf8');
                await this.db.exec(schema);
                logger_1.logger.info('Database schema initialized successfully');
            }
            else {
                logger_1.logger.error(`Schema file not found: ${this.schemaPath}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取数据库连接
     */
    async getDb() {
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
    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
            logger_1.logger.info('Database connection closed');
        }
    }
}
exports.DatabaseManager = DatabaseManager;
/**
 * Knowledge database class - Handles database operations for the knowledge base
 */
class KnowledgeDatabase {
    /**
     * Initialize the knowledge database
     * @param dbPath Optional path to the database file
     */
    constructor(dbPath) {
        this.dbPath = ''; // Initialize with empty string to fix the error
        if (dbPath) {
            this.dbPath = dbPath;
            // Use getInstance instead of direct constructor since it's private
            this.dbManager = DatabaseManager.getInstance();
            // Set custom path in environment if needed
            process.env.DB_PATH = dbPath;
        }
        else {
            // Otherwise use the singleton instance
            this.dbManager = DatabaseManager.getInstance();
        }
    }
    /**
     * Initialize the database connection
     */
    async initialize() {
        await this.dbManager.init();
        logger_1.logger.info('Knowledge database initialized');
    }
    /**
     * Close the database connection
     */
    async close() {
        await this.dbManager.close();
    }
    /**
     * Get the database connection
     */
    async getDb() {
        return await this.dbManager.getDb();
    }
}
exports.KnowledgeDatabase = KnowledgeDatabase;
//# sourceMappingURL=db.js.map