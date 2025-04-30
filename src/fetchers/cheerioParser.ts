import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

/**
 * Moodle 课程中的内容类型
 */
export enum MoodleContentType {
  ASSIGNMENT = 'assignment',
  RESOURCE = 'resource',
  URL = 'url',
  FORUM = 'forum',
  QUIZ = 'quiz',
  FOLDER = 'folder',
  ANNOUNCEMENT = 'announcement',
  OTHER = 'other'
}

/**
 * Moodle 内容项接口
 */
export interface MoodleContentItem {
  id: string;
  name: string;
  type: MoodleContentType;
  url: string;
  content?: string;
  htmlContent?: string;
  sectionName?: string;
  sectionId?: string;
  dueDate?: string;
  courseId?: number;
}

/**
 * Moodle 课程接口
 */
export interface MoodleCourse {
  id: number;
  name: string;
  sections: MoodleSection[];
}

/**
 * Moodle 课程章节接口
 */
export interface MoodleSection {
  id: string;
  name: string;
  items: MoodleContentItem[];
}

/**
 * Moodle HTML 解析器类 - 使用 Cheerio 解析 Moodle 页面内容
 */
export class CheerioParser {
  /**
   * 解析课程页面，提取课程结构和内容项
   * @param html - 课程页面的 HTML 内容
   * @param courseId - 课程 ID
   */
  parseCoursePageHtml(html: string, courseId: number): MoodleCourse {
    const $ = cheerio.load(html);
    const courseName = $('.page-header-headings h1').text().trim();
    
    logger.info(`Parsing course page: ${courseName}`);
    
    const sections: MoodleSection[] = [];
    
    // 解析课程章节
    $('.section.main').each((i, sectionEl) => {
      const sectionId = $(sectionEl).attr('id') || `section-${i}`;
      const sectionName = $(sectionEl).find('.sectionname').text().trim() || `Section ${i + 1}`;
      
      const items: MoodleContentItem[] = [];
      
      // 解析章节内的活动项目
      $(sectionEl).find('li.activity').each((j, activityEl) => {
        try {
          const activityId = $(activityEl).attr('id') || '';
          const moduleIdMatch = activityId.match(/module-([0-9]+)/);
          const moduleId = moduleIdMatch ? moduleIdMatch[1] : `unknown-${j}`;
          
          const activityLink = $(activityEl).find('.activityinstance > a').first();
          const activityName = activityLink.find('.instancename').clone().children().remove().end().text().trim();
          const activityUrl = activityLink.attr('href') || '';
          
          // 确定活动类型
          let activityType = MoodleContentType.OTHER;
          if ($(activityEl).hasClass('assign')) {
            activityType = MoodleContentType.ASSIGNMENT;
          } else if ($(activityEl).hasClass('resource')) {
            activityType = MoodleContentType.RESOURCE;
          } else if ($(activityEl).hasClass('url')) {
            activityType = MoodleContentType.URL;
          } else if ($(activityEl).hasClass('forum')) {
            activityType = MoodleContentType.FORUM;
          } else if ($(activityEl).hasClass('quiz')) {
            activityType = MoodleContentType.QUIZ;
          } else if ($(activityEl).hasClass('folder')) {
            activityType = MoodleContentType.FOLDER;
          }
          
          // 获取截止日期（如果有）
          const dueDateEl = $(activityEl).find('.date');
          const dueDate = dueDateEl.length > 0 ? dueDateEl.text().trim() : undefined;
          
          items.push({
            id: moduleId,
            name: activityName,
            type: activityType,
            url: activityUrl,
            sectionName,
            sectionId,
            dueDate,
            courseId
          });
        } catch (error) {
          logger.error(`Error parsing activity: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      
      sections.push({
        id: sectionId,
        name: sectionName,
        items
      });
    });
    
    logger.info(`Parsed ${sections.length} sections with ${sections.reduce((acc, section) => acc + section.items.length, 0)} total items`);
    
    return {
      id: courseId,
      name: courseName,
      sections
    };
  }

  /**
   * 解析作业页面，提取作业详情、要求和评分标准
   * @param html - 作业页面的 HTML 内容
   */
  parseAssignmentHtml(html: string): Partial<MoodleContentItem> {
    const $ = cheerio.load(html);
    
    // 提取作业详情
    const description = $('.assignmenttext').html() || '';
    const criteria = $('.gradingmethodpreview').html() || '';
    
    // 提取截止日期
    const dueDate = $('.submissionstatustable .cell.c1').filter((i, el) => {
      return $(el).prev().text().includes('Due date');
    }).text().trim();
    
    // 清理和组合内容
    const content = [
      description,
      criteria,
      `Due date: ${dueDate}`
    ].filter(Boolean).join('\n\n');
    
    return {
      content,
      htmlContent: description + criteria,
      dueDate
    };
  }

  /**
   * 解析论坛页面，提取论坛讨论
   * @param html - 论坛页面的 HTML 内容
   */
  parseForumHtml(html: string): Partial<MoodleContentItem> {
    const $ = cheerio.load(html);
    
    const description = $('.intro').html() || '';
    let discussions = '';
    
    // 提取讨论主题列表
    $('.discussion').each((i, el) => {
      const topic = $(el).find('.topic').text().trim();
      const author = $(el).find('.author').text().trim();
      discussions += `- ${topic} (by ${author})\n`;
    });
    
    const content = [description, discussions].filter(Boolean).join('\n\n');
    
    return {
      content,
      htmlContent: description
    };
  }

  /**
   * 解析资源页面，提取资源内容
   * @param html - 资源页面的 HTML 内容
   */
  parseResourceHtml(html: string): Partial<MoodleContentItem> {
    const $ = cheerio.load(html);
    
    // 资源页面通常是文件链接或嵌入内容
    const content = $('.resourcecontent').text().trim();
    const htmlContent = $('.resourcecontent').html() || '';
    
    return {
      content,
      htmlContent
    };
  }

  /**
   * 从通用页面提取主要内容
   * @param html - HTML 内容
   */
  parseGenericPageHtml(html: string): Partial<MoodleContentItem> {
    const $ = cheerio.load(html);
    
    // 尝试提取页面主要内容区域
    const contentAreas = [
      '#region-main',
      '.region-main',
      '.course-content',
      'main',
      '#page-content'
    ];
    
    for (const selector of contentAreas) {
      const contentEl = $(selector);
      if (contentEl.length > 0) {
        const content = contentEl.text().trim();
        const htmlContent = contentEl.html() || '';
        
        return {
          content,
          htmlContent
        };
      }
    }
    
    // 如果未找到特定内容区域，返回整个 body 内容
    return {
      content: $('body').text().trim(),
      htmlContent: $('body').html() || ''
    };
  }
}