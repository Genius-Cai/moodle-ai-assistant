"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodleApiFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const settings_1 = require("../config/settings");
/**
 * Moodle API 抓取器 - 利用 Moodle Web 服务 API 获取数据
 * 注意：本项目主要使用基于 Cookie 的 HTML 抓取，此类用于兼容需要 API 的场景
 */
class MoodleApiFetcher {
    constructor() {
        this.baseUrl = settings_1.appSettings.moodleBaseUrl;
        this.sessionCookie = settings_1.appSettings.moodleSessionCookie;
    }
    /**
     * 获取课程列表
     * @returns 课程列表
     */
    async getCourses() {
        try {
            logger_1.logger.info('获取课程列表');
            // 使用 cookie 访问我的课程页面
            const response = await axios_1.default.get(`${this.baseUrl}/my/`, {
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            // 这里需要解析HTML内容来获取课程列表
            // 实际实现应该使用 cheerio 解析 response.data
            const courses = [];
            logger_1.logger.info(`获取到 ${courses.length} 门课程`);
            return courses;
        }
        catch (error) {
            logger_1.logger.error(`获取课程列表失败: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * 获取单个课程的详情
     * @param courseId 课程ID
     * @returns 课程详情
     */
    async getCourse(courseId) {
        try {
            logger_1.logger.info(`获取课程详情: ${courseId}`);
            // 使用 cookie 访问课程页面
            const response = await axios_1.default.get(`${this.baseUrl}/course/view.php`, {
                params: {
                    id: courseId
                },
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            // 这里需要解析HTML内容来获取课程详情
            // 实际实现应该使用 cheerio 解析 response.data
            logger_1.logger.info(`成功获取课程详情`);
            return {
                id: courseId,
                // 其他字段需要从HTML中解析
            };
        }
        catch (error) {
            logger_1.logger.error(`获取课程详情失败: ${courseId}, ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * 获取课程内容
     * @param courseId 课程ID
     * @returns 课程内容
     */
    async getCourseContents(courseId) {
        try {
            logger_1.logger.info(`获取课程内容: ${courseId}`);
            // 使用 cookie 访问课程页面
            const response = await axios_1.default.get(`${this.baseUrl}/course/view.php`, {
                params: {
                    id: courseId
                },
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            // 这里需要解析HTML内容来获取课程内容
            // 实际实现应该使用 cheerio 解析 response.data
            const sections = [];
            logger_1.logger.info(`成功获取课程内容，共 ${sections.length} 个章节`);
            return sections;
        }
        catch (error) {
            logger_1.logger.error(`获取课程内容失败: ${courseId}, ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
}
exports.MoodleApiFetcher = MoodleApiFetcher;
//# sourceMappingURL=moodleApiFetcher.js.map