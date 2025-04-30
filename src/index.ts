#!/usr/bin/env node

import { program } from 'commander';
import { initAskCommand } from './cli/ask';
import { buildKnowledgeBase } from './knowledge/builder';
import { appSettings, loadAuthSettings } from './config/settings';
import { logger } from './utils/logger';

// Define option interfaces
interface BuildOptions {
  course?: string;
  rebuild?: boolean;
  verbose?: boolean;
  config?: string;
}

interface AskOptions {
  course?: string;
  verbose?: boolean;
  context?: boolean;
  config?: string;
}

// 初始化 CLI
program
  .name('moodle-ai')
  .description('Moodle AI 助手 - 帮助您查询 Moodle 课程信息')
  .version('1.0.0');

// 知识库构建命令
program
  .command('build')
  .description('构建 Moodle 知识库')
  .option('-c, --course <courseid>', '指定课程 ID 进行爬取')
  .option('-r, --rebuild', '重新构建知识库（不使用缓存）', false)
  .option('-v, --verbose', '显示详细日志', false)
  .option('--config <path>', '指定配置文件路径')
  .action(async (options: BuildOptions) => {
    // 设置详细日志模式
    if (options.verbose) {
      logger.level = 'debug';
    }

    // 重载配置（如果提供）
    if (options.config) {
      loadAuthSettings();
    }

    try {
      await buildKnowledgeBase({
        courseId: options.course ? parseInt(options.course, 10) : undefined,
        rebuild: options.rebuild || false
      });
    } catch (error) {
      console.error(`构建知识库失败: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 问题命令 (直接在此定义，也可以通过 initAskCommand 导入)
program
  .command('ask <question>')
  .description('向 AI 助手提问关于 Moodle 的问题')
  .option('-c, --course <courseid>', '指定课程 ID 进行上下文搜索')
  .option('-v, --verbose', '显示详细日志', false)
  .option('--context', '显示使用的上下文', false)
  .option('--config <path>', '指定配置文件路径')
  .action(async (question: string, options: AskOptions) => {
    // 委托给 ask 模块处理
    const { askQuestion } = await import('./cli/ask');
    await askQuestion(question, options);
  });

// 添加其他可能的命令
initAskCommand();

// 解析参数并执行
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}