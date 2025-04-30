import axios, { AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';
import { appSettings } from '../config/settings';

/**
 * MoodleHtmlFetcher 类 - 负责使用 Cookie 抓取 Moodle 页面的 HTML 内容
 */
export class MoodleHtmlFetcher {
  private baseUrl: string;
  private cookie: string;
  private fetchDelay: number;
  private fetchTimeout: number;

  constructor() {
    this.baseUrl = appSettings.moodleBaseUrl;
    this.cookie = appSettings.moodleSessionCookie;
    this.fetchDelay = appSettings.fetchDelay;
    this.fetchTimeout = appSettings.fetchTimeout;

    if (!this.cookie) {
      throw new Error('Moodle session cookie is not set in the configuration');
    }
  }

  /**
   * 获取请求配置
   */
  private getRequestConfig(): AxiosRequestConfig {
    return {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
      timeout: this.fetchTimeout,
    };
  }

  /**
   * 延迟执行，避免请求过于频繁
   */
  private async delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.fetchDelay));
  }

  /**
   * 获取课程页面 HTML
   * @param courseId - 课程 ID
   */
  async fetchCoursePageHtml(courseId: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/course/view.php?id=${courseId}`;
      logger.info(`Fetching course page: ${url}`);
      
      const response = await axios.get(url, this.getRequestConfig());
      await this.delay();
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching course page: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取模块内容页面 HTML
   * @param moduleId - 模块 ID
   */
  async fetchModuleHtml(moduleId: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/mod/resource/view.php?id=${moduleId}`;
      logger.info(`Fetching module content: ${url}`);
      
      const response = await axios.get(url, this.getRequestConfig());
      await this.delay();
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching module: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取作业页面 HTML
   * @param assignmentId - 作业 ID
   */
  async fetchAssignmentHtml(assignmentId: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/mod/assign/view.php?id=${assignmentId}`;
      logger.info(`Fetching assignment: ${url}`);
      
      const response = await axios.get(url, this.getRequestConfig());
      await this.delay();
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching assignment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取论坛页面 HTML
   * @param forumId - 论坛 ID
   */
  async fetchForumHtml(forumId: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/mod/forum/view.php?id=${forumId}`;
      logger.info(`Fetching forum: ${url}`);
      
      const response = await axios.get(url, this.getRequestConfig());
      await this.delay();
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching forum: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取通用页面 HTML
   * @param url - 页面 URL
   */
  async fetchGenericPageHtml(url: string): Promise<string> {
    try {
      logger.info(`Fetching generic page: ${url}`);
      
      const response = await axios.get(url, this.getRequestConfig());
      await this.delay();
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching generic page: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}