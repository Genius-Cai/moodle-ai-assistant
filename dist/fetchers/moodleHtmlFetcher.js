"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodleHtmlFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const settings_1 = require("../config/settings");
/**
 * MoodleHtmlFetcher 类 - 负责使用 Cookie 抓取 Moodle 页面的 HTML 内容
 */
class MoodleHtmlFetcher {
    constructor() {
        this.baseUrl = settings_1.appSettings.moodleBaseUrl;
        this.cookie = settings_1.appSettings.moodleSessionCookie;
        this.fetchDelay = settings_1.appSettings.fetchDelay;
        this.fetchTimeout = settings_1.appSettings.fetchTimeout;
        if (!this.cookie) {
            throw new Error('Moodle session cookie is not set in the configuration');
        }
    }
    /**
     * 获取请求配置
     */
    getRequestConfig() {
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
    async delay() {
        return new Promise((resolve) => setTimeout(resolve, this.fetchDelay));
    }
    /**
     * 获取课程页面 HTML
     * @param courseId - 课程 ID
     */
    async fetchCoursePageHtml(courseId) {
        try {
            const url = `${this.baseUrl}/course/view.php?id=${courseId}`;
            logger_1.logger.info(`Fetching course page: ${url}`);
            const response = await axios_1.default.get(url, this.getRequestConfig());
            await this.delay();
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching course page: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取模块内容页面 HTML
     * @param moduleId - 模块 ID
     */
    async fetchModuleHtml(moduleId) {
        try {
            const url = `${this.baseUrl}/mod/resource/view.php?id=${moduleId}`;
            logger_1.logger.info(`Fetching module content: ${url}`);
            const response = await axios_1.default.get(url, this.getRequestConfig());
            await this.delay();
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching module: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取作业页面 HTML
     * @param assignmentId - 作业 ID
     */
    async fetchAssignmentHtml(assignmentId) {
        try {
            const url = `${this.baseUrl}/mod/assign/view.php?id=${assignmentId}`;
            logger_1.logger.info(`Fetching assignment: ${url}`);
            const response = await axios_1.default.get(url, this.getRequestConfig());
            await this.delay();
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching assignment: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取论坛页面 HTML
     * @param forumId - 论坛 ID
     */
    async fetchForumHtml(forumId) {
        try {
            const url = `${this.baseUrl}/mod/forum/view.php?id=${forumId}`;
            logger_1.logger.info(`Fetching forum: ${url}`);
            const response = await axios_1.default.get(url, this.getRequestConfig());
            await this.delay();
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching forum: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取通用页面 HTML
     * @param url - 页面 URL
     */
    async fetchGenericPageHtml(url) {
        try {
            logger_1.logger.info(`Fetching generic page: ${url}`);
            const response = await axios_1.default.get(url, this.getRequestConfig());
            await this.delay();
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching generic page: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.MoodleHtmlFetcher = MoodleHtmlFetcher;
//# sourceMappingURL=moodleHtmlFetcher.js.map