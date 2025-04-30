import axios from 'axios';
import { JSDOM } from 'jsdom';
import { logger } from '../utils/logger';
import { stripHtml } from '../utils/helpers';
import { config } from '../config/settings';

/**
 * CSE 抓取器，用于获取 CSE 课程网站的内容
 */
export class CSEFetcher {
  private readonly baseUrl: string;
  private cookies: string;

  constructor() {
    this.baseUrl = 'https://cgi.cse.unsw.edu.au';
    this.cookies = '';
  }

  /**
   * 登录 CSE 系统
   * @param username zID 用户名
   * @param password 密码
   * @returns 登录成功返回true，失败返回false
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      logger.info('尝试登录 CSE 系统');
      
      // 获取登录页面，提取CSRF令牌
      const loginPageResp = await axios.get(`${this.baseUrl}/~cs6080/login`);
      const loginPageDom = new JSDOM(loginPageResp.data);
      const csrfToken = loginPageDom.window.document.querySelector('input[name="csrf_token"]')?.getAttribute('value') || '';
      
      if (!csrfToken) {
        logger.error('登录 CSE 系统失败: 无法获取CSRF令牌');
        return false;
      }
      
      // 保存cookies
      if (loginPageResp.headers['set-cookie']) {
        this.cookies = loginPageResp.headers['set-cookie'].join('; ');
      }
      
      // 发送登录请求
      const response = await axios.post(`${this.baseUrl}/~cs6080/login`, 
        new URLSearchParams({
          'csrf_token': csrfToken,
          'username': username,
          'password': password
        }),
        {
          headers: {
            'Cookie': this.cookies,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          maxRedirects: 0,
          validateStatus: (status) => {
            return status >= 200 && status < 400;
          }
        }
      );
      
      // 保存认证cookies
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ');
      }
      
      // 检查是否登录成功（通常通过重定向或特定页面元素）
      const isSuccess = response.status === 302 || response.data.includes('Welcome');
      logger.info(isSuccess ? '成功登录 CSE 系统' : '登录 CSE 系统失败');
      
      return isSuccess;
    } catch (error) {
      logger.error('登录 CSE 系统失败', { error });
      return false;
    }
  }

  /**
   * 获取课程公告列表
   * @param courseCode 课程代码，如 cs6080
   * @returns 公告列表
   */
  async getCourseAnnouncements(courseCode: string): Promise<any[]> {
    try {
      logger.info(`获取 CSE 课程公告: ${courseCode}`);
      
      const response = await axios.get(`${this.baseUrl}/~${courseCode}/announcements`, {
        headers: {
          'Cookie': this.cookies
        }
      });
      
      // 解析HTML页面
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      const announcements: any[] = [];
      
      // 查找公告元素（根据实际页面结构调整选择器）
      const announcementElements = document.querySelectorAll('.announcement');
      
      for (let i = 0; i < announcementElements.length; i++) {
        const element = announcementElements[i];
        const title = element.querySelector('.title')?.textContent?.trim() || '无标题公告';
        const date = element.querySelector('.date')?.textContent?.trim() || '';
        const content = element.querySelector('.content')?.innerHTML || '';
        
        // 解析日期字符串为时间戳
        let timestamp = Math.floor(Date.now() / 1000); // 默认为当前时间
        if (date) {
          try {
            timestamp = Math.floor(new Date(date).getTime() / 1000);
          } catch (e) {
            logger.warn(`无法解析日期: ${date}`);
          }
        }
        
        announcements.push({
          title: title,
          date: date,
          content: stripHtml(content),
          timestamp: timestamp,
          rawHtml: content
        });
      }
      
      logger.info(`成功获取 CSE 课程公告: ${announcements.length} 条`);
      return announcements;
    } catch (error) {
      logger.error(`获取 CSE 课程公告失败: ${courseCode}`, { error });
      return [];
    }
  }

  /**
   * 获取课程资料列表
   * @param courseCode 课程代码，如 cs6080
   * @returns 课程资料列表
   */
  async getCourseResources(courseCode: string): Promise<any[]> {
    try {
      logger.info(`获取 CSE 课程资料: ${courseCode}`);
      
      const response = await axios.get(`${this.baseUrl}/~${courseCode}/resources`, {
        headers: {
          'Cookie': this.cookies
        }
      });
      
      // 解析HTML页面
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      const resources: any[] = [];
      
      // 查找资源元素（根据实际页面结构调整选择器）
      const resourceElements = document.querySelectorAll('.resource');
      
      for (let i = 0; i < resourceElements.length; i++) {
        const element = resourceElements[i];
        const title = element.querySelector('.title')?.textContent?.trim() || '无标题资源';
        const url = element.querySelector('a')?.getAttribute('href') || '';
        const description = element.querySelector('.description')?.innerHTML || '';
        
        resources.push({
          title: title,
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          description: stripHtml(description)
        });
      }
      
      logger.info(`成功获取 CSE 课程资料: ${resources.length} 项`);
      return resources;
    } catch (error) {
      logger.error(`获取 CSE 课程资料失败: ${courseCode}`, { error });
      return [];
    }
  }

  /**
   * 获取资源文件内容
   * @param url 资源URL
   * @returns 文件内容
   */
  async getResourceContent(url: string): Promise<string | null> {
    try {
      logger.info(`获取资源内容: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': this.cookies
        },
        responseType: 'text'
      });
      
      logger.info('成功获取资源内容');
      return response.data;
    } catch (error) {
      logger.error(`获取资源内容失败: ${url}`, { error });
      return null;
    }
  }

  /**
   * 将 CSE 内容转换为知识库条目
   * @param courseCode CSE 课程代码
   * @param moodleCourseId Moodle 课程 ID（用于存储）
   * @returns 知识库条目数组
   */
  async getAllContentAsKnowledgeItems(courseCode: string, moodleCourseId: string): Promise<any[]> {
    const knowledgeItems: any[] = [];
    
    // 获取公告
    const announcements = await this.getCourseAnnouncements(courseCode);
    for (const announcement of announcements) {
      knowledgeItems.push({
        courseId: moodleCourseId,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        metadata: JSON.stringify({
          date: announcement.date
        }),
        source: 'cse',
        sourceId: `cse_announcement_${announcement.title}_${announcement.timestamp}`,
        created: announcement.timestamp,
        modified: announcement.timestamp
      });
    }
    
    // 获取资源
    const resources = await this.getCourseResources(courseCode);
    for (const resource of resources) {
      // 尝试获取资源内容（如果是文本文件）
      let content = resource.description;
      if (resource.url.endsWith('.txt') || resource.url.endsWith('.md') || 
          resource.url.endsWith('.html') || resource.url.endsWith('.htm')) {
        const resourceContent = await this.getResourceContent(resource.url);
        if (resourceContent) {
          content = stripHtml(resourceContent);
        }
      }
      
      knowledgeItems.push({
        courseId: moodleCourseId,
        type: 'resource',
        title: resource.title,
        content: content,
        metadata: JSON.stringify({
          url: resource.url
        }),
        source: 'cse',
        sourceId: `cse_resource_${resource.url}`,
        created: Math.floor(Date.now() / 1000),
        modified: Math.floor(Date.now() / 1000)
      });
    }
    
    logger.info(`成功从 CSE 获取 ${knowledgeItems.length} 条知识条目`);
    return knowledgeItems;
  }
}