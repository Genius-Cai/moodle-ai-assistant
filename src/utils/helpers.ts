import { createHash } from 'crypto';

/**
 * 从HTML内容中提取纯文本
 * @param html HTML内容
 * @returns 纯文本内容
 */
export function stripHtml(html: string): string {
  // 如果输入为空，返回空字符串
  if (!html) {
    return '';
  }
  
  // 移除所有HTML标签
  const text = html.replace(/<[^>]*>?/gm, '');
  
  // 替换HTML实体
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成文本的SHA-256哈希值
 * @param text 输入文本
 * @returns 哈希值
 */
export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * 截断文本到指定长度
 * @param text 文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * 将Unix时间戳格式化为可读的日期字符串
 * @param timestamp Unix时间戳（秒）
 * @returns 格式化的日期字符串
 */
export function formatTimestamp(timestamp: number): string {
  // Create a new Date object from the timestamp (multiply by 1000 to convert seconds to milliseconds)
  const date = new Date(timestamp * 1000);
  
  // Format the date using toLocaleString with zh-CN locale
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化错误对象为字符串
 * @param error 错误对象
 * @returns 格式化的错误信息
 */
export function formatError(error: any): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return JSON.stringify(error);
  }
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}