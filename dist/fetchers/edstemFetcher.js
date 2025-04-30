"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdStemFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const settings_1 = require("../config/settings");
/**
 * Ed 平台抓取器
 * 用于获取 Ed 平台上的课程讨论内容
 */
class EdStemFetcher {
    constructor() {
        this.baseUrl = settings_1.appSettings.moodleBaseUrl;
        this.sessionCookie = settings_1.appSettings.moodleSessionCookie;
    }
    /**
     * 获取 Ed 讨论内容
     * @param courseId 课程ID
     * @returns 讨论内容
     */
    async getDiscussions(courseId) {
        try {
            logger_1.logger.info(`获取Ed讨论内容: ${courseId}`);
            // 这是一个示例，实际实现需要根据 Ed 平台的 API 或 HTML 页面结构
            // 使用 cookie 进行身份验证访问
            const response = await axios_1.default.get(`${this.baseUrl}/mod/lti/view.php`, {
                params: {
                    id: courseId,
                    course: courseId
                },
                headers: {
                    Cookie: this.sessionCookie
                }
            });
            // 这里是一个简化的示例，需要解析响应内容
            const discussions = [];
            logger_1.logger.info(`获取到 ${discussions.length} 条讨论`);
            return discussions;
        }
        catch (error) {
            logger_1.logger.error(`获取Ed讨论内容失败: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
}
exports.EdStemFetcher = EdStemFetcher;
//# sourceMappingURL=edstemFetcher.js.map