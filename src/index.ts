#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config } from './config/settings';
import { logger } from './utils/logger';
import { MoodleApiFetcher } from './fetchers/moodleApiFetcher';
import { initDB, closeDB } from './knowledge/db';
import { insertMoodleContent } from './knowledge/insert';

/**
 * 获取课程内容并保存到知识库
 */
async function fetchCourseContent(courseId: string): Promise<void> {
  logger.info(`开始获取课程内容: ${courseId}`);
  
  try {
    // 初始化数据库
    await initDB();
    
    // 创建Moodle API请求器
    const fetcher = new MoodleApiFetcher();
    
    // 获取课程信息
    const courseInfo = await fetcher.getCourseInfo(courseId);
    if (!courseInfo) {
      logger.error(`未找到课程: ${courseId}`);
      return;
    }
    
    logger.info(`成功获取课程信息: ${courseInfo.fullname}`);
    
    // 获取课程内容（公告和作业）
    const content = await fetcher.getAllCourseContent(courseId);
    
    logger.info(`获取到 ${content.announcements.length} 条公告和 ${content.assignments.length} 个作业`);
    
    // 将内容保存到知识库
    const insertCount = await insertMoodleContent(courseId, content);
    
    logger.info(`成功保存 ${insertCount} 条内容到知识库`);
  } catch (error) {
    logger.error(`获取课程内容失败: ${courseId}`, { error });
  } finally {
    // 关闭数据库连接
    await closeDB();
  }
}

/**
 * 显示项目版本和基本信息
 */
function showVersion(): void {
  console.log('Moodle AI Assistant v0.1.0');
  console.log('© 2025 UNSW');
}

/**
 * 显示项目基本使用帮助
 */
function showHelp(): void {
  console.log('Moodle AI Assistant - 智能课程助手');
  console.log('\n用法:');
  console.log('  npm start -- [命令] [选项]');
  console.log('\n命令:');
  console.log('  fetch  获取课程内容并存储到知识库');
  console.log('  ask    向助手提问');
  console.log('\n选项:');
  console.log('  -c, --course  指定课程ID');
  console.log('  -q, --query   提问内容');
  console.log('  -h, --help    显示帮助信息');
  console.log('  -v, --version 显示版本信息');
  console.log('\n示例:');
  console.log('  npm start -- fetch -c 12345');
  console.log('  npm start -- ask -q "midterm考试内容是什么?"');
}

/**
 * 主函数
 */
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('fetch', '获取课程内容', (yargs) => {
      return yargs.option('c', {
        alias: 'course',
        describe: '课程ID',
        type: 'string',
        demandOption: true,
      });
    })
    .command('ask', '向助手提问', (yargs) => {
      return yargs.option('q', {
        alias: 'query',
        describe: '问题',
        type: 'string',
        demandOption: true,
      });
    })
    .option('v', {
      alias: 'version',
      describe: '显示版本',
      type: 'boolean',
    })
    .option('h', {
      alias: 'help',
      describe: '显示帮助',
      type: 'boolean',
    })
    .help(false)
    .version(false)
    .argv;

  if (argv.h || argv.help) {
    showHelp();
    return;
  }

  if (argv.v || argv.version) {
    showVersion();
    return;
  }

  if (argv._.includes('fetch')) {
    if (!argv.c && !argv.course) {
      console.error('错误: 请指定课程ID');
      showHelp();
      return;
    }
    const courseId = (argv.c || argv.course) as string;
    await fetchCourseContent(courseId);
  } else if (argv._.includes('ask')) {
    console.log('问答功能尚未实现，将在阶段2中完成');
    // 问答功能将在阶段2实现
  } else {
    console.log('请指定要执行的命令');
    showHelp();
  }
}

// 执行主函数
main().catch((error) => {
  logger.error('程序执行失败', { error });
  process.exit(1);
});