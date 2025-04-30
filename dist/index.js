#!/usr/bin/env node
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
const commander_1 = require("commander");
const ask_1 = require("./cli/ask");
const builder_1 = require("./knowledge/builder");
const settings_1 = require("./config/settings");
const logger_1 = require("./utils/logger");
// 初始化 CLI
commander_1.program
    .name('moodle-ai')
    .description('Moodle AI 助手 - 帮助您查询 Moodle 课程信息')
    .version('1.0.0');
// 知识库构建命令
commander_1.program
    .command('build')
    .description('构建 Moodle 知识库')
    .option('-c, --course <courseid>', '指定课程 ID 进行爬取')
    .option('-r, --rebuild', '重新构建知识库（不使用缓存）', false)
    .option('-v, --verbose', '显示详细日志', false)
    .option('--config <path>', '指定配置文件路径')
    .action(async (options) => {
    // 设置详细日志模式
    if (options.verbose) {
        logger_1.logger.level = 'debug';
    }
    // 重载配置（如果提供）
    if (options.config) {
        (0, settings_1.loadAuthSettings)();
    }
    try {
        await (0, builder_1.buildKnowledgeBase)({
            courseId: options.course ? parseInt(options.course, 10) : undefined,
            rebuild: options.rebuild || false
        });
    }
    catch (error) {
        console.error(`构建知识库失败: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
// 问题命令 (直接在此定义，也可以通过 initAskCommand 导入)
commander_1.program
    .command('ask <question>')
    .description('向 AI 助手提问关于 Moodle 的问题')
    .option('-c, --course <courseid>', '指定课程 ID 进行上下文搜索')
    .option('-v, --verbose', '显示详细日志', false)
    .option('--context', '显示使用的上下文', false)
    .option('--config <path>', '指定配置文件路径')
    .action(async (question, options) => {
    // 委托给 ask 模块处理
    const { askQuestion } = await Promise.resolve().then(() => __importStar(require('./cli/ask')));
    await askQuestion(question, options);
});
// 添加其他可能的命令
(0, ask_1.initAskCommand)();
// 解析参数并执行
commander_1.program.parse(process.argv);
// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
//# sourceMappingURL=index.js.map