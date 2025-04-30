import { KnowledgeSearchResult } from '../knowledge/query';
import { ChatMessage } from './openaiClient';
import { formatTimestamp } from '../utils/helpers';

/**
 * 生成系统提示词
 * @returns 系统提示词消息
 */
export function generateSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content: `你是一个负责任的课程助手，专注于回答学生关于课程内容的问题。
你的回答将严格基于我提供的上下文信息，不要添加没有在上下文中明确提到的细节。
如果你不确定或者在上下文信息中找不到答案，直接说明你不知道，不要猜测。
尽可能提供全面准确的信息，但要保持简洁。
你的回答应当既专业又友好，使用学术风格的中文。`
  };
}

/**
 * 生成用户提示词
 * @param question 用户问题
 * @param context 上下文信息
 * @returns 用户提示词消息
 */
export function generateUserPrompt(question: string, context: string): ChatMessage {
  return {
    role: 'user',
    content: `问题：${question}\n\n上下文信息：\n${context}\n\n基于以上上下文，请回答我的问题。`
  };
}

/**
 * 将搜索结果格式化为上下文文本
 * @param results 搜索结果
 * @returns 格式化后的上下文文本
 */
export function formatKnowledgeContext(results: KnowledgeSearchResult[]): string {
  // 按相关性排序
  const sortedResults = [...results].sort((a, b) => b.relevance - a.relevance);
  
  let context = '';
  for (const result of sortedResults) {
    // 添加元数据
    let metadata = '';
    if (result.source === 'moodle') {
      metadata += '来源: Moodle 课程平台';
    } else if (result.source === 'edstem') {
      metadata += '来源: EdStem 讨论平台';
    } else {
      metadata += `来源: ${result.source}`;
    }
    
    // 添加时间信息
    if (result.created) {
      metadata += `, 发布时间: ${formatTimestamp(result.created)}`;
    }
    
    // 组合内容
    context += `===== ${result.title} =====\n`;
    context += `${metadata}\n\n`;
    context += `${result.content}\n\n`;
  }
  
  return context;
}

/**
 * 生成公告摘要提示词
 * @param courseName 课程名称
 * @param context 公告上下文
 * @returns 消息数组
 */
export function generateSummaryPrompt(courseName: string, context: string): ChatMessage[] {
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `你是一个课程助手，负责总结课程公告。
你的任务是将多个公告整合成一个简明扼要的摘要，保留所有重要日期、截止日期和关键信息。
按重要性和时间顺序组织信息，突出最紧急的事项。
使用课程相关术语保持专业。
使用简明的中文。`
  };
  
  const userPrompt: ChatMessage = {
    role: 'user',
    content: `请为课程"${courseName}"的以下公告生成一个简洁的摘要：\n\n${context}`
  };
  
  return [systemPrompt, userPrompt];
}

/**
 * 生成作业指导提示词
 * @param assignmentName 作业名称
 * @param context 作业上下文
 * @returns 消息数组
 */
export function generateAssignmentGuidancePrompt(assignmentName: string, context: string): ChatMessage[] {
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `你是一个课程助手，专注于帮助学生理解作业要求。
你的回答必须完全基于我提供的上下文信息，不要添加任何未明确提及的内容。
你的回复应包含以下几部分（如果相关信息存在）：
1. 作业概述：简要说明作业的目标和背景
2. 关键要求：列出作业的主要部分和具体要求
3. 评分标准：概述评分的关键要点
4. 截止日期：明确提交时间
5. 建议：基于评分标准提供2-3条有用的建议
使用专业学术的中文写作风格。`
  };
  
  const userPrompt: ChatMessage = {
    role: 'user',
    content: `请为作业"${assignmentName}"提供指导，基于以下信息：\n\n${context}`
  };
  
  return [systemPrompt, userPrompt];
}