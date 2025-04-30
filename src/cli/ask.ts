#!/usr/bin/env node

import { EOL } from 'os';
import chalk from 'chalk';
import { program } from 'commander';
import { generateAnswer } from '../ai/answer';
import { appSettings } from '../config/settings';
import { KnowledgeDatabase } from '../knowledge/db';
import { logger } from '../utils/logger';

// Import ora with a type definition
import ora from 'ora';

interface AskOptions {
  course?: string;
  verbose?: boolean;
  context?: boolean;
  config?: string;
}

/**
 * 初始化命令行界面
 */
export function initAskCommand(): void {
  program
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
export async function askQuestion(question: string, options: AskOptions): Promise<void> {
  // 设置详细日志模式
  if (options.verbose) {
    logger.level = 'debug';
  }
  
  // 显示正在处理的标志
  const spinner = ora('正在思考中...').start();
  
  try {
    // 创建数据库连接
    const db = new KnowledgeDatabase(appSettings.dbPath);
    await db.initialize();
    
    // 生成回答
    const result = await generateAnswer(question, {
      courseId: options.course ? parseInt(options.course, 10) : undefined,
      showContext: options.context || false
    });
    
    // 停止加载动画并显示结果
    spinner.stop();
    
    // 输出回答
    console.log(EOL);
    console.log(chalk.bold('问题:'), question);
    console.log(EOL);
    console.log(chalk.bold('回答:'));
    console.log(result.answer);
    
    // 如果需要，显示使用的上下文
    if (options.context && result.context) {
      console.log(EOL);
      console.log(chalk.bold.yellow('使用的上下文:'));
      console.log(chalk.gray(result.context.join(EOL + '---' + EOL)));
    }
    
    // 关闭数据库连接
    await db.close();
    
  } catch (error) {
    // 处理错误
    spinner.fail('生成回答时出错');
    console.error(chalk.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}