import { chromium, Browser, Page } from 'playwright';
import { logger } from '../utils/logger';
import { appSettings } from '../config/settings';

/**
 * 页面导航器类 - 使用 Playwright 模拟浏览器交互获取复杂内容
 */
export class PageNavigator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private cookie: string;

  constructor() {
    this.baseUrl = appSettings.moodleBaseUrl;
    this.cookie = appSettings.moodleSessionCookie;

    if (!this.cookie) {
      throw new Error('Moodle session cookie is not set in the configuration');
    }
  }

  /**
   * 初始化浏览器
   */
  async init(): Promise<void> {
    if (this.browser) return;
    
    logger.info('Initializing Playwright browser');
    
    this.browser = await chromium.launch({
      headless: true // 在生产环境中使用 headless 模式
    });
    
    const context = await this.browser.newContext();
    
    // 从完整 Cookie 字符串中提取 MoodleSession 值
    const moodleSessionMatch = this.cookie.match(/MoodleSession=([^;]+)/);
    const moodleSessionValue = moodleSessionMatch ? moodleSessionMatch[1] : this.cookie;
    
    // 设置 Cookie
    await context.addCookies([
      {
        name: 'MoodleSession',
        value: moodleSessionValue,
        domain: new URL(this.baseUrl).hostname,
        path: '/'
      }
    ]);
    
    this.page = await context.newPage();
    logger.info('Playwright browser initialized');
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.info('Playwright browser closed');
    }
  }

  /**
   * 导航到指定 URL 并等待页面加载
   */
  async navigateTo(url: string): Promise<string> {
    if (!this.page) {
      await this.init();
    }

    if (!this.page) {
      throw new Error('Failed to initialize Playwright page');
    }

    logger.info(`Navigating to: ${url}`);
    
    await this.page.goto(url, { waitUntil: 'networkidle' });
    await this.page.waitForSelector('body');
    
    return await this.page.content();
  }

  /**
   * 获取需要额外交互才能访问的作业详情页面
   */
  async getAssignmentDetails(assignmentUrl: string): Promise<string> {
    if (!this.page) {
      await this.init();
    }

    if (!this.page) {
      throw new Error('Failed to initialize Playwright page');
    }
    
    logger.info(`Getting assignment details from: ${assignmentUrl}`);
    
    await this.page.goto(assignmentUrl, { waitUntil: 'networkidle' });
    
    // 等待作业内容加载
    await this.page.waitForSelector('.assignmenttext, .submissionstatustable');
    
    // 检查是否有"查看评分标准"按钮，如果有则点击
    const hasCriteriaButton = await this.page.locator('button:has-text("View grading criteria")').count() > 0;
    if (hasCriteriaButton) {
      logger.info('Clicking on "View grading criteria" button');
      await this.page.click('button:has-text("View grading criteria")');
      await this.page.waitForSelector('.gradingmethodpreview', { timeout: 5000 }).catch(() => {
        logger.warn('Could not find grading criteria after clicking button');
      });
    }
    
    return await this.page.content();
  }

  /**
   * 获取需要额外交互才能访问的论坛帖子详情
   */
  async getForumPostDetails(forumDiscussionUrl: string): Promise<string> {
    if (!this.page) {
      await this.init();
    }

    if (!this.page) {
      throw new Error('Failed to initialize Playwright page');
    }
    
    logger.info(`Getting forum post details from: ${forumDiscussionUrl}`);
    
    await this.page.goto(forumDiscussionUrl, { waitUntil: 'networkidle' });
    
    // 等待论坛帖子内容加载
    await this.page.waitForSelector('.forumpost');
    
    // 展开所有回复
    const expandButtons = await this.page.locator('.collapsibleregioncaption').all();
    for (const button of expandButtons) {
      await button.click().catch(() => {
        // 忽略可能的点击错误
      });
      // 短暂暂停以确保展开动画完成
      await this.page.waitForTimeout(300);
    }
    
    return await this.page.content();
  }

  /**
   * 获取需要额外交互才能访问的测验详情
   */
  async getQuizDetails(quizUrl: string): Promise<string> {
    if (!this.page) {
      await this.init();
    }

    if (!this.page) {
      throw new Error('Failed to initialize Playwright page');
    }
    
    logger.info(`Getting quiz details from: ${quizUrl}`);
    
    await this.page.goto(quizUrl, { waitUntil: 'networkidle' });
    
    // 等待测验内容加载
    await this.page.waitForSelector('.quizinfo, .generalbox');
    
    // 检查是否有预览按钮，但不点击启动测验
    const hasPreviewButton = await this.page.locator('a:has-text("Preview quiz now")').count() > 0;
    if (hasPreviewButton) {
      logger.info('Found quiz preview button, but not clicking to avoid starting quiz');
    }
    
    return await this.page.content();
  }
}