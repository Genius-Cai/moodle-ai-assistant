#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAskCommand = initAskCommand;
exports.askQuestion = askQuestion;
const os_1 = require("os");
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const answer_1 = require("../ai/answer");
const settings_1 = require("../config/settings");
const db_1 = require("../knowledge/db");
const logger_1 = require("../utils/logger");
// Import ora with a type definition
const ora_1 = __importDefault(require("ora"));
/**
 * 初始化命令行界面
 */
function initAskCommand() {
    commander_1.program
        .command('ask')
        .description('向 AI 助手提问关于 Moodle 的问题')
        .argument('<question>', '你的问题')
        .option('-c, --course <courseid>', '指定课程 ID 进行上下文搜索')
        .option('-v, --verbose', '显示详细日志', false)
        .option('--context', '显示使用的上下文', false)
        .option('--config <path>', '指定配置文件路径')
        .action(askQuestion);
}
/**
 * 执行问答过程
 * @param question 用户问题
 * @param options 命令选项
 */
async function askQuestion(question, options) {
    // 设置详细日志模式
    if (options.verbose) {
        logger_1.logger.level = 'debug';
    }
    // 显示正在处理的标志
    const spinner = (0, ora_1.default)('正在思考中...').start();
    try {
        // 创建数据库连接
        const db = new db_1.KnowledgeDatabase(settings_1.appSettings.dbPath);
        await db.initialize();
        // 生成回答
        const result = await (0, answer_1.generateAnswer)(question, {
            courseId: options.course ? parseInt(options.course, 10) : undefined,
            showContext: options.context || false
        });
        // 停止加载动画并显示结果
        spinner.stop();
        // 输出回答
        console.log(os_1.EOL);
        console.log(chalk_1.default.bold('问题:'), question);
        console.log(os_1.EOL);
        console.log(chalk_1.default.bold('回答:'));
        console.log(result.answer);
        // 如果需要，显示使用的上下文
        if (options.context && result.context) {
            console.log(os_1.EOL);
            console.log(chalk_1.default.bold.yellow('使用的上下文:'));
            console.log(chalk_1.default.gray(result.context.join(os_1.EOL + '---' + os_1.EOL)));
        }
        // 关闭数据库连接
        await db.close();
    }
    catch (error) {
        // 处理错误
        spinner.fail('生成回答时出错');
        console.error(chalk_1.default.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
}
//# sourceMappingURL=ask.js.map