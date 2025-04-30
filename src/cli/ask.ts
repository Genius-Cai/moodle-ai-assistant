#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initDB, closeDB } from '../knowledge/db';
import { MoodleApiFetcher } from '../fetchers/moodleApiFetcher';
import { KnowledgeItem } from '../types/api';
import { insertKnowledgeItem, batchInsertKnowledgeItems } from '../knowledge/insert';
import { config } from '../config/settings';
import { logger } from '../utils/logger';
import { formatTimestamp, stripHtml, truncateText } from '../utils/helpers';
import { KnowledgeQuery } from '../knowledge/query';
import { AnswerEngine, AnswerResponse } from '../ai/answer';

/**
 * 处理用户问题
 */
class MoodleAssistant {
  private openaiApiKey: string;
  private knowledgeQuery: KnowledgeQuery;
  private answerEngine: AnswerEngine;
  private moodleFetcher: MoodleApiFetcher;

  constructor() {
    this.openaiApiKey = config.openai.apiKey;
    this.knowledgeQuery = new KnowledgeQuery();
    this.answerEngine = new AnswerEngine(this.openaiApiKey, this.knowledgeQuery);
    this.moodleFetcher = new MoodleApiFetcher();
    
    logger.info('Moodle 助手初始化完成');
  }

  /**
   * 处理用户问题
   * @param question 用户问题
   * @param options 选项
   * @returns 回答
   */
  async askQuestion(question: string, options: { courseId?: string } = {}): Promise<AnswerResponse> {
    try {
      await initDB();
      
      logger.info(`收到问题: "${question}"`);
      
      // 查找可用课程
      let courseId = options.courseId;
      if (!courseId && config.courses.length > 0) {
        courseId = config.courses[0].id;
        logger.info(`未指定课程ID，使用默认课程: ${courseId}`);
      }
      
      // 生成回答
      const response = await this.answerEngine.getAnswer(question, courseId);
      
      // 打印回答
      console.log('\n\x1b[1m回答:\x1b[0m');
      console.log(response.answer);
      
      // 打印来源
      if (response.sources.length > 0) {
        console.log('\n\x1b[1m来源:\x1b[0m');
        response.sources.forEach((source, index) => {
          console.log(`${index + 1}. ${source.title} (${formatTimestamp(source.created)})`);
        });
      }
      
      return response;
    } catch (error) {
      logger.error(`回答问题失败: ${error}`);
      throw error;
    } finally {
      await closeDB();
    }
  }

  /**
   * 刷新课程内容
   * @param courseIds 课程ID数组
   * @returns 更新的内容数量
   */
  async refreshCourseContent(courseIds: string[]): Promise<number> {
    try {
      await initDB();
      
      let totalInserted = 0;
      
      // 遍历所有课程
      for (const courseId of courseIds) {
        logger.info(`刷新课程内容: ${courseId}`);
        
        // 获取课程信息
        const courseInfo = await this.moodleFetcher.getCourseInfo(courseId);
        if (!courseInfo) {
          logger.error(`未找到课程: ${courseId}`);
          continue;
        }
        
        // 获取公告和作业
        const content = await this.moodleFetcher.getAllCourseContent(courseId);
        
        // 插入知识库
        const insertedCount = await insertMoodleContent(courseId, content);
        totalInserted += insertedCount;
        
        logger.info(`已为课程 ${courseId} 更新 ${insertedCount} 条内容`);
      }
      
      return totalInserted;
    } catch (error) {
      logger.error(`刷新课程内容失败: ${error}`);
      throw error;
    } finally {
      await closeDB();
    }
  }
  
  /**
   * 生成课程内容摘要
   * @param options 选项
   * @returns 摘要文本
   */
  async generateSummary(options: { courseId?: string } = {}): Promise<string> {
    try {
      await initDB();
      
      // 查找可用课程
      let courseId = options.courseId;
      if (!courseId && config.courses.length > 0) {
        courseId = config.courses[0].id;
        logger.info(`未指定课程ID，使用默认课程: ${courseId}`);
      }
      
      if (!courseId) {
        return "错误: 未指定课程ID，且无默认课程";
      }
      
      // 获取课程信息用于摘要
      const courseInfo = await this.moodleFetcher.getCourseInfo(courseId);
      const courseName = courseInfo ? courseInfo.fullname : `课程 ${courseId}`;
      
      // 生成摘要
      const summary = await this.answerEngine.summarizeAnnouncements(courseId, courseName);
      
      console.log('\n\x1b[1m课程摘要:\x1b[0m');
      console.log(summary);
      
      return summary;
    } catch (error) {
      logger.error(`生成摘要失败: ${error}`);
      throw error;
    } finally {
      await closeDB();
    }
  }
  
  /**
   * 获取作业指导
   * @param options 选项
   * @returns 指导文本
   */
  async getAssignmentHelp(options: { courseId?: string, assignment?: string } = {}): Promise<AnswerResponse> {
    try {
      await initDB();
      
      // 查找可用课程
      let courseId = options.courseId;
      if (!courseId && config.courses.length > 0) {
        courseId = config.courses[0].id;
        logger.info(`未指定课程ID，使用默认课程: ${courseId}`);
      }
      
      if (!courseId) {
        return {
          answer: "错误: 未指定课程ID，且无默认课程",
          sources: [],
          isDirectMatch: false
        };
      }
      
      const assignmentName = options.assignment || '';
      if (!assignmentName) {
        return {
          answer: "错误: 未指定作业名称",
          sources: [],
          isDirectMatch: false
        };
      }
      
      // 生成作业指导
      const response = await this.answerEngine.getAssignmentGuidance(courseId, assignmentName);
      
      console.log('\n\x1b[1m作业指导:\x1b[0m');
      console.log(response.answer);
      
      // 打印来源
      if (response.sources.length > 0) {
        console.log('\n\x1b[1m来源:\x1b[0m');
        response.sources.forEach((source, index) => {
          console.log(`${index + 1}. ${source.title} (${formatTimestamp(source.created)})`);
        });
      }
      
      return response;
    } catch (error) {
      logger.error(`获取作业指导失败: ${error}`);
      throw error;
    } finally {
      await closeDB();
    }
  }
}

/**
 * 从Moodle内容批量创建知识条目并插入数据库
 * @param courseId 课程ID
 * @param content Moodle课程内容
 * @returns 插入的条目数量
 */
async function insertMoodleContent(
  courseId: string,
  content: {
    announcements: Array<{ title: string, content: string, created: number, id: string }>,
    assignments: Array<{ title: string, content: string, dueDate: number, id: string }>
  }
): Promise<number> {
  const items: KnowledgeItem[] = [];

  // 处理公告
  for (const announcement of content.announcements) {
    items.push({
      courseId,
      type: 'announcement',
      title: announcement.title,
      content: stripHtml(announcement.content),
      metadata: JSON.stringify({ 
        postedDate: new Date(announcement.created * 1000).toISOString() 
      }),
      source: 'moodle',
      sourceId: announcement.id,
      created: announcement.created,
      modified: announcement.created
    });
  }

  // 处理作业
  for (const assignment of content.assignments) {
    items.push({
      courseId,
      type: 'assignment',
      title: assignment.title,
      content: stripHtml(assignment.content),
      metadata: JSON.stringify({ 
        dueDate: new Date(assignment.dueDate * 1000).toISOString() 
      }),
      source: 'moodle',
      sourceId: assignment.id,
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000)
    });
  }

  // 批量插入
  return batchInsertKnowledgeItems(items);
}

/**
 * 主函数
 */
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('ask', '向助手提问', (yargs) => {
      return yargs
        .option('q', {
          alias: 'query',
          describe: '问题内容',
          type: 'string',
          demandOption: true
        })
        .option('c', {
          alias: 'course',
          describe: '课程ID',
          type: 'string'
        });
    })
    .command('refresh', '刷新课程内容', (yargs) => {
      return yargs
        .option('c', {
          alias: 'course',
          describe: '课程ID，不指定则刷新所有配置的课程',
          type: 'string'
        });
    })
    .command('summary', '生成课程摘要', (yargs) => {
      return yargs
        .option('c', {
          alias: 'course',
          describe: '课程ID',
          type: 'string'
        });
    })
    .command('assignment', '获取作业指导', (yargs) => {
      return yargs
        .option('a', {
          alias: 'assignment',
          describe: '作业名称',
          type: 'string',
          demandOption: true
        })
        .option('c', {
          alias: 'course',
          describe: '课程ID',
          type: 'string'
        });
    })
    .help()
    .argv;

  const assistant = new MoodleAssistant();

  try {
    if (argv._.includes('ask') && argv.q) {
      await assistant.askQuestion(argv.q as string, { 
        courseId: argv.c as string
      });
    } else if (argv._.includes('refresh')) {
      // 确定要刷新的课程ID
      let courseIds: string[] = [];
      if (argv.c) {
        courseIds = [argv.c as string];
      } else if (config.courses.length > 0) {
        courseIds = config.courses.map(c => c.id);
      }
      
      if (courseIds.length === 0) {
        console.error('错误: 未指定课程ID，且没有配置默认课程');
        return;
      }
      
      const count = await assistant.refreshCourseContent(courseIds);
      console.log(`总共更新了 ${count} 条内容`);
    } else if (argv._.includes('summary')) {
      await assistant.generateSummary({ 
        courseId: argv.c as string 
      });
    } else if (argv._.includes('assignment') && argv.a) {
      await assistant.getAssignmentHelp({ 
        courseId: argv.c as string,
        assignment: argv.a as string
      });
    } else {
      console.log('请指定要执行的命令和必要参数');
      yargs(hideBin(process.argv)).showHelp();
    }
  } catch (error) {
    console.error(`执行失败: ${error}`);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

export { MoodleAssistant };