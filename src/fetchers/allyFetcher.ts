import axios from 'axios';
import { logger } from '../utils/logger';
import { stripHtml } from '../utils/helpers';
import { appSettings } from '../config/settings';

/**
 * Ally 抓取器，用于获取课程中的辅助性资源，如PDF、文档等。
 */
export class AllyFetcher {
  private readonly baseUrl: string;
  private readonly sessionCookie: string;

  constructor() {
    this.baseUrl = appSettings.moodleBaseUrl;
    this.sessionCookie = appSettings.moodleSessionCookie;
  }

  /**
   * 获取课程中的辅助性资源
   * @param courseId 课程ID
   * @returns 获取到的资源列表
   */
  async getCourseResources(courseId: string): Promise<any[]> {
    try {
      logger.info(`获取课程辅助性资源: ${courseId}`);
      
      // 使用cookie模拟登录获取资源
      const response = await axios.get(`${this.baseUrl}/course/view.php`, {
        params: {
          id: courseId
        },
        headers: {
          Cookie: this.sessionCookie
        }
      });

      // 这只是一个示例，实际实现需要解析HTML内容
      const resources: any[] = [];
      // 这里需要使用cheerio解析response.data来提取资源信息
      
      logger.info(`成功获取资源文件信息`);
      return resources;
    } catch (error) {
      logger.error(`获取课程辅助性资源失败: ${courseId}`, error instanceof Error ? error.message : String(error));
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
      // 使用cookie访问文件
      const response = await axios.get(fileUrl, {
        responseType: 'text',
        timeout: 30000,
        headers: {
          Cookie: this.sessionCookie
        }
      });

      if (response.data) {
        logger.info(`成功获取资源文件内容`);
        return response.data;
      }

      logger.warn(`资源文件内容为空`);
      return null;
    } catch (error) {
      logger.error(`获取资源文件内容失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}