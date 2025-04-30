import axios from 'axios';
import { logger } from '../utils/logger';
import { stripHtml } from '../utils/helpers';
import { config } from '../config/settings';

/**
 * Ally 抓取器，用于获取课程中的辅助性资源，如PDF、文档等。
 */
export class AllyFetcher {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = config.moodle.baseUrl;
    this.token = config.moodle.token;
  }

  /**
   * 获取课程中的辅助性资源
   * @param courseId 课程ID
   * @returns 获取到的资源列表
   */
  async getCourseResources(courseId: string): Promise<any[]> {
    try {
      logger.info(`获取课程辅助性资源: ${courseId}`);
      // 这里是示例代码，实际实现需要根据Ally API进行调整
      const response = await axios.get(`${this.baseUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: 'core_course_get_contents',
          courseid: courseId,
          moodlewsrestformat: 'json'
        }
      });

      // 处理返回数据，筛选出资源文件
      const resources: any[] = [];
      if (Array.isArray(response.data)) {
        for (const section of response.data) {
          if (Array.isArray(section.modules)) {
            for (const module of section.modules) {
              if (module.modname === 'resource' && Array.isArray(module.contents)) {
                for (const content of module.contents) {
                  resources.push({
                    id: `resource_${content.fileurl}`,
                    courseId,
                    title: content.filename,
                    type: 'resource',
                    fileUrl: content.fileurl,
                    mimeType: content.mimetype,
                    filesize: content.filesize,
                    created: Date.now() / 1000, // 使用当前时间戳，因为API可能没有返回创建时间
                    summary: module.description ? stripHtml(module.description) : ''
                  });
                }
              }
            }
          }
        }
      }

      logger.info(`成功获取 ${resources.length} 个资源文件`);
      return resources;
    } catch (error) {
      logger.error(`获取课程辅助性资源失败: ${courseId}`, { error });
      return [];
    }
  }

  /**
   * 获取资源文件内容（如果是文本类型）
   * @param fileUrl 文件URL
   * @returns 文件内容
   */
  async getResourceContent(fileUrl: string): Promise<string | null> {
    try {
      // 处理带token的URL
      const url = new URL(fileUrl);
      if (!url.searchParams.has('token')) {
        url.searchParams.append('token', this.token);
      }

      const response = await axios.get(url.toString(), {
        responseType: 'text',
        timeout: 30000
      });

      if (response.data) {
        logger.info(`成功获取资源文件内容`);
        // 根据文件类型进行处理，如果是文本则直接返回，如果是PDF等需要额外处理
        return response.data;
      }

      logger.warn(`资源文件内容为空`);
      return null;
    } catch (error) {
      logger.error(`获取资源文件内容失败`, { error });
      return null;
    }
  }
}