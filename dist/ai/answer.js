"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerGenerator = exports.AnswerGenerator = void 0;
exports.generateAnswer = generateAnswer;
const openaiClient_1 = require("./openaiClient");
const query_1 = require("../knowledge/query");
const promptTemplates_1 = require("./promptTemplates");
const logger_1 = require("../utils/logger");
/**
 * AI 回答生成器 - 负责生成对用户问题的回答
 */
class AnswerGenerator {
    constructor() {
        this.openaiClient = new openaiClient_1.OpenAIClient();
        this.knowledgeQuery = new query_1.KnowledgeQuery();
    }
    /**
     * 生成回答
     * @param question - 用户问题
     * @param courseId - 可选的课程 ID 过滤
     * @returns 生成的回答
     */
    async generateAnswer(question, courseId) {
        try {
            logger_1.logger.info(`Generating answer for question: "${question}"`);
            // 确定相关的提示模板
            const promptTemplate = this.determinePromptTemplate(question);
            // 查询知识库获取相关上下文
            const queryParams = {
                query: question,
                courseId,
                limit: 5,
                threshold: 10 // 最低相关性分数
            };
            const matchResults = await this.knowledgeQuery.query(queryParams);
            // 提取上下文信息
            const contexts = matchResults.map(result => {
                const item = result.item;
                return `【${item.title}】(${item.type})\n${item.content}`;
            });
            // 如果没有找到相关上下文，使用特殊提示模板
            if (contexts.length === 0) {
                logger_1.logger.info('No relevant context found, using NO_CONTEXT_REPLY template');
                return await this.openaiClient.complete(promptTemplates_1.PromptTemplates.NO_CONTEXT_REPLY + question);
            }
            // 生成回答
            const contextText = contexts.join('\n\n');
            const promptText = `${promptTemplate}\n\n问题: ${question}\n\n上下文信息:\n${contextText}`;
            const answer = await this.openaiClient.complete(promptText);
            logger_1.logger.info('Answer generated successfully');
            return answer;
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate answer: ${error instanceof Error ? error.message : String(error)}`);
            return '抱歉，生成回答时遇到了问题。请稍后再试或联系技术支持。';
        }
    }
    /**
     * 根据问题内容确定使用哪个提示模板
     * @param question - 用户问题
     * @returns 选定的提示模板
     */
    determinePromptTemplate(question) {
        // 转为小写以便不区分大小写匹配
        const lowerQuestion = question.toLowerCase();
        // 高分攻略相关
        if (lowerQuestion.includes('高分') ||
            lowerQuestion.includes('好成绩') ||
            lowerQuestion.includes('满分') ||
            lowerQuestion.includes('如何得分') ||
            lowerQuestion.includes('评分标准') ||
            lowerQuestion.includes('分数') ||
            lowerQuestion.includes('高mark') ||
            lowerQuestion.includes('high mark')) {
            return promptTemplates_1.PromptTemplates.HOW_TO_GET_GOOD_MARKS;
        }
        // 解释复杂概念
        if (lowerQuestion.includes('解释') ||
            lowerQuestion.includes('什么是') ||
            lowerQuestion.includes('定义') ||
            lowerQuestion.includes('概念') ||
            lowerQuestion.includes('意思')) {
            return promptTemplates_1.PromptTemplates.EXPLAIN_COMPLEX_CONCEPT;
        }
        // 课程内容总结
        if (lowerQuestion.includes('总结') ||
            lowerQuestion.includes('概述') ||
            lowerQuestion.includes('介绍') ||
            lowerQuestion.includes('大纲')) {
            return promptTemplates_1.PromptTemplates.SUMMARIZE_COURSE_CONTENT;
        }
        // 作业规划
        if (lowerQuestion.includes('规划') ||
            lowerQuestion.includes('计划') ||
            lowerQuestion.includes('如何完成') ||
            lowerQuestion.includes('准备') ||
            lowerQuestion.includes('步骤')) {
            return promptTemplates_1.PromptTemplates.ASSIGNMENT_PLANNING;
        }
        // 考试复习
        if (lowerQuestion.includes('考试') ||
            lowerQuestion.includes('复习') ||
            lowerQuestion.includes('测验') ||
            lowerQuestion.includes('quiz') ||
            lowerQuestion.includes('exam') ||
            lowerQuestion.includes('midterm') ||
            lowerQuestion.includes('final')) {
            return promptTemplates_1.PromptTemplates.EXAM_REVISION;
        }
        // 默认使用基础提示模板
        return promptTemplates_1.PromptTemplates.BASE_SYSTEM_PROMPT;
    }
}
exports.AnswerGenerator = AnswerGenerator;
// Create a singleton instance
exports.answerGenerator = new AnswerGenerator();
/**
 * Generate an answer to a question
 *
 * @param question The question to answer
 * @param options Options for generating the answer
 * @returns The answer and context used to generate it
 */
async function generateAnswer(question, options) {
    try {
        logger_1.logger.info(`Generating answer for question: "${question}"`);
        // Create a new query to get context
        const knowledgeQuery = new query_1.KnowledgeQuery();
        // Query the knowledge base for relevant context
        const queryParams = {
            query: question,
            courseId: options?.courseId,
            limit: 5,
            threshold: 10 // Minimum relevance score
        };
        const matchResults = await knowledgeQuery.query(queryParams);
        // Extract context information
        const contexts = matchResults.map(result => {
            const item = result.item;
            return `【${item.title}】(${item.type})\n${item.content}`;
        });
        let answer;
        // If no relevant context found, use special prompt template
        if (contexts.length === 0) {
            logger_1.logger.info('No relevant context found, using base template');
            answer = await openaiClient_1.openai.complete(`Please answer the following question about Moodle based on your knowledge:\n\nQuestion: ${question}`);
        }
        else {
            // Generate answer using the context
            const contextText = contexts.join('\n\n');
            const promptText = `Please answer the following question about Moodle based on the provided context information:\n\nQuestion: ${question}\n\nContext Information:\n${contextText}`;
            answer = await openaiClient_1.openai.complete(promptText);
        }
        logger_1.logger.info('Answer generated successfully');
        return {
            answer,
            context: options?.showContext ? contexts : undefined
        };
    }
    catch (error) {
        logger_1.logger.error(`Failed to generate answer: ${error instanceof Error ? error.message : String(error)}`);
        return {
            answer: '抱歉，生成回答时遇到了问题。请稍后再试或联系技术支持。'
        };
    }
}
//# sourceMappingURL=answer.js.map