import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// 日志配置
const logLevel = process.env.LOG_LEVEL || 'info';
const logPath = process.env.LOG_PATH || './logs';

// 确保日志目录存在
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

// 创建日志文件名，使用日期作为文件名前缀
const logFileName = path.join(logPath, `${new Date().toISOString().split('T')[0]}-moodle-ai.log`);

// 创建 Winston 日志记录器
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'moodle-ai-assistant' },
  transports: [
    // 将日志写入文件
    new winston.transports.File({ 
      filename: logFileName,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // 错误日志单独写入错误日志文件
    new winston.transports.File({ 
      filename: path.join(logPath, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// 在非生产环境，同时将日志输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 导出简便的日志方法
export const log = {
  info: (message: string) => logger.info(message),
  error: (message: string, error?: Error) => {
    if (error) {
      logger.error(`${message}: ${error.message}`, { stack: error.stack });
    } else {
      logger.error(message);
    }
  },
  warn: (message: string) => logger.warn(message),
  debug: (message: string) => logger.debug(message),
};