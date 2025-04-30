"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllyFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const settings_1 = require("../config/settings");
/**
 * Ally 抓取器，用于获取课程中的辅助性资源，如PDF、文档等。
 */
class AllyFetcher {
    constructor() {
        this.baseUrl = settings_1.appSettings.moodleBaseUrl;
        this.sessionCookie = settings_1.appSettings.moodleSessionCookie;
    }
    /**
     * 获取课程中的辅助性资源
     * @param courseId 课程ID
     * @returns 获取到的资源列表
     */
    async getCourseResources(courseId) {
        try {
            logger_1.logger.info(`获取课程辅助性资源: ${courseId}`);
            // 使用cookie模拟登录获取资源
            const response = await axios_1.default.get(`${this.baseUrl}/course/view.php`, {
                params: {
                    id: courseId
                },
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            // 这只是一个示例，实际实现需要解析HTML内容
            const resources = [];
            // 这里需要使用cheerio解析response.data来提取资源信息
            logger_1.logger.info(`成功获取资源文件信息`);
            return resources;
        }
        catch (error) {
            logger_1.logger.error(`获取课程辅助性资源失败: ${courseId}`, error instanceof Error ? error.message : String(error));
            return [];
        }
    }
    /**
     * 获取资源文件内容（如果是文本类型）
     * @param fileUrl 文件URL
     * @returns 文件内容
     */
    async getResourceContent(fileUrl) {
        try {
            // 使用cookie访问文件
            const response = await axios_1.default.get(fileUrl, {
                responseType: 'text',
                timeout: 30000,
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            if (response.data) {
                logger_1.logger.info(`成功获取资源文件内容`);
                return response.data;
            }
            logger_1.logger.warn(`资源文件内容为空`);
            return null;
        }
        catch (error) {
            logger_1.logger.error(`获取资源文件内容失败: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
}
exports.AllyFetcher = AllyFetcher;
//# sourceMappingURL=allyFetcher.js.map