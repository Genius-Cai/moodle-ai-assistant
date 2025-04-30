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
exports.log = exports.logger = void 0;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
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
exports.logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json()),
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
    exports.logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}
// 导出简便的日志方法
exports.log = {
    info: (message) => exports.logger.info(message),
    error: (message, error) => {
        if (error) {
            exports.logger.error(`${message}: ${error.message}`, { stack: error.stack });
        }
        else {
            exports.logger.error(message);
        }
    },
    warn: (message) => exports.logger.warn(message),
    debug: (message) => exports.logger.debug(message),
};
//# sourceMappingURL=logger.js.map