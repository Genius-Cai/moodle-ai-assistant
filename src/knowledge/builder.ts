import { CheerioParser, MoodleContentItem, MoodleContentType, MoodleCourse } from '../fetchers/cheerioParser';
import { MoodleHtmlFetcher } from '../fetchers/moodleHtmlFetcher';
import { PageNavigator } from '../fetchers/pageNavigator';
import { KnowledgeInserter } from './insert';
import { KnowledgeType } from './types';
import { logger } from '../utils/logger';

/**
 * 知识库构建器 - 负责抓取 Moodle 内容并构建知识库
 */
export class KnowledgeBuilder {
  private htmlFetcher: MoodleHtmlFetcher;
  private cheerioParser: CheerioParser;
  private pageNavigator: PageNavigator;
  private knowledgeInserter: KnowledgeInserter;

  constructor() {
    this.htmlFetcher = new MoodleHtmlFetcher();
    this.cheerioParser = new CheerioParser();
    this.pageNavigator = new PageNavigator();
    this.knowledgeInserter = new KnowledgeInserter();
  }

  /**
   * 从 Moodle 课程构建知识库
   * @param courseIds - 要处理的课程 ID 数组
   * @param clearExisting - 是否在构建前清除现有数据
   */
  public async buildFromCourses(courseIds: number[], clearExisting: boolean = false): Promise<void> {
    logger.info(`Starting knowledge base build for ${courseIds.length} courses`);
    
    for (const courseId of courseIds) {
      try {
        if (clearExisting) {
          await this.knowledgeInserter.clearCourse(courseId);
        }
        
        await this.processCourse(courseId);
      } catch (error) {
        logger.error(`Error processing course ${courseId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 关闭 PageNavigator 浏览器
    await this.pageNavigator.close();
    logger.info('Knowledge base build completed');
  }

  /**
   * 处理单个课程
   * @param courseId - 课程 ID
   */
  private async processCourse(courseId: number): Promise<void> {
    try {
      // 获取课程页面 HTML
      const courseHtml = await this.htmlFetcher.fetchCoursePageHtml(courseId);
      
      // 解析课程结构
      const course = this.cheerioParser.parseCoursePageHtml(courseHtml, courseId);
      
      // 保存课程基本信息
      await this.saveBasicCourseInfo(course);
      
      // 处理所有课程内容项
      for (const section of course.sections) {
        for (const item of section.items) {
          try {
            await this.processContentItem(item, course.name);
          } catch (error) {
            logger.error(`Error processing item ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      logger.info(`Processed course: ${course.name} (${courseId})`);
    } catch (error) {
      logger.error(`Failed to process course ${courseId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 保存课程基本信息
   * @param course - 课程对象
   */
  private async saveBasicCourseInfo(course: MoodleCourse): Promise<void> {
    // 构建课程概述内容
    const sectionNames = course.sections.map(section => section.name).join('\\n- ');
    const content = `课程：${course.name}\\n\\n章节：\\n- ${sectionNames}`;
    
    // 将课程信息保存到知识库
    await this.knowledgeInserter.insertOrUpdate({
      title: `${course.name} 概述`,
      type: KnowledgeType.COURSE_INFO,
      content,
      course_id: course.id,
      course_name: course.name
    });
  }

  /**
   * 处理课程内容项
   * @param item - 课程内容项
   * @param courseName - 课程名称
   */
  private async processContentItem(item: MoodleContentItem, courseName: string): Promise<void> {
    // 根据内容类型进行处理
    switch (item.type) {
      case MoodleContentType.ASSIGNMENT:
        await this.processAssignment(item, courseName);
        break;
      
      case MoodleContentType.FORUM:
        await this.processForum(item, courseName);
        break;
      
      case MoodleContentType.RESOURCE:
        await this.processResource(item, courseName);
        break;
      
      case MoodleContentType.QUIZ:
        await this.processQuiz(item, courseName);
        break;
      
      default:
        await this.processGenericItem(item, courseName);
        break;
    }
  }

  /**
   * 处理作业内容
   * @param item - 作业项
   * @param courseName - 课程名称
   */
  private async processAssignment(item: MoodleContentItem, courseName: string): Promise<void> {
    try {
      // 使用 PageNavigator 获取带有评分标准的作业详情
      const html = await this.pageNavigator.getAssignmentDetails(item.url);
      
      // 解析作业详情
      const assignmentDetails = this.cheerioParser.parseAssignmentHtml(html);
      
      // 合并内容
      const content = assignmentDetails.content || item.content || '';
      const htmlContent = assignmentDetails.htmlContent || item.htmlContent;
      const dueDate = assignmentDetails.dueDate || item.dueDate;
      
      // 保存到知识库
      await this.knowledgeInserter.insertOrUpdate({
        title: item.name,
        type: KnowledgeType.ASSIGNMENT,
        content,
        html_content: htmlContent,
        course_id: item.courseId!,
        course_name: courseName,
        section_name: item.sectionName,
        url: item.url,
        due_date: dueDate
      });
      
      logger.info(`Processed assignment: ${item.name}`);
    } catch (error) {
      logger.error(`Failed to process assignment ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理论坛内容
   * @param item - 论坛项
   * @param courseName - 课程名称
   */
  private async processForum(item: MoodleContentItem, courseName: string): Promise<void> {
    try {
      // 获取论坛 HTML
      const html = await this.htmlFetcher.fetchForumHtml(parseInt(item.id));
      
      // 解析论坛内容
      const forumDetails = this.cheerioParser.parseForumHtml(html);
      
      // 合并内容
      const content = forumDetails.content || item.content || '';
      const htmlContent = forumDetails.htmlContent || item.htmlContent;
      
      // 保存到知识库
      await this.knowledgeInserter.insertOrUpdate({
        title: item.name,
        type: KnowledgeType.FORUM_POST,
        content,
        html_content: htmlContent,
        course_id: item.courseId!,
        course_name: courseName,
        section_name: item.sectionName,
        url: item.url
      });
      
      logger.info(`Processed forum: ${item.name}`);
    } catch (error) {
      logger.error(`Failed to process forum ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理资源内容
   * @param item - 资源项
   * @param courseName - 课程名称
   */
  private async processResource(item: MoodleContentItem, courseName: string): Promise<void> {
    try {
      // 获取资源 HTML
      const html = await this.htmlFetcher.fetchModuleHtml(parseInt(item.id));
      
      // 解析资源内容
      const resourceDetails = this.cheerioParser.parseResourceHtml(html);
      
      // 合并内容
      const content = resourceDetails.content || item.content || '';
      const htmlContent = resourceDetails.htmlContent || item.htmlContent;
      
      // 保存到知识库
      await this.knowledgeInserter.insertOrUpdate({
        title: item.name,
        type: KnowledgeType.RESOURCE,
        content,
        html_content: htmlContent,
        course_id: item.courseId!,
        course_name: courseName,
        section_name: item.sectionName,
        url: item.url
      });
      
      logger.info(`Processed resource: ${item.name}`);
    } catch (error) {
      logger.error(`Failed to process resource ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理测验内容
   * @param item - 测验项
   * @param courseName - 课程名称
   */
  private async processQuiz(item: MoodleContentItem, courseName: string): Promise<void> {
    try {
      // 使用 PageNavigator 获取测验详情（但不启动测验）
      const html = await this.pageNavigator.getQuizDetails(item.url);
      
      // 解析测验内容（使用通用解析器）
      const quizDetails = this.cheerioParser.parseGenericPageHtml(html);
      
      // 合并内容
      const content = quizDetails.content || item.content || '';
      const htmlContent = quizDetails.htmlContent || item.htmlContent;
      
      // 保存到知识库
      await this.knowledgeInserter.insertOrUpdate({
        title: item.name,
        type: KnowledgeType.QUIZ,
        content,
        html_content: htmlContent,
        course_id: item.courseId!,
        course_name: courseName,
        section_name: item.sectionName,
        url: item.url
      });
      
      logger.info(`Processed quiz: ${item.name}`);
    } catch (error) {
      logger.error(`Failed to process quiz ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理通用内容项
   * @param item - 通用内容项
   * @param courseName - 课程名称
   */
  private async processGenericItem(item: MoodleContentItem, courseName: string): Promise<void> {
    try {
      // 获取通用内容 HTML
      const html = await this.htmlFetcher.fetchGenericPageHtml(item.url);
      
      // 解析通用内容
      const genericDetails = this.cheerioParser.parseGenericPageHtml(html);
      
      // 合并内容
      const content = genericDetails.content || item.content || '';
      const htmlContent = genericDetails.htmlContent || item.htmlContent;
      
      // 保存到知识库
      await this.knowledgeInserter.insertOrUpdate({
        title: item.name,
        type: KnowledgeType.OTHER,
        content,
        html_content: htmlContent,
        course_id: item.courseId!,
        course_name: courseName,
        section_name: item.sectionName,
        url: item.url
      });
      
      logger.info(`Processed generic item: ${item.name}`);
    } catch (error) {
      logger.error(`Failed to process generic item ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Build knowledge base from Moodle courses
 * @param options Options for building the knowledge base
 * @returns Promise that resolves when building is complete
 */
export async function buildKnowledgeBase(options: {
  courseId?: number;
  rebuild?: boolean;
}): Promise<void> {
  const builder = new KnowledgeBuilder();
  
  // If specific course ID is provided, build just that course
  const courseIds = options.courseId ? [options.courseId] : [1, 2, 3]; // Default course IDs, replace with your logic
  
  await builder.buildFromCourses(courseIds, options.rebuild || false);
  
  logger.info('Knowledge base build completed via buildKnowledgeBase function');
}