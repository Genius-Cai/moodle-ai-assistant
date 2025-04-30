/**
 * HTML 工具函数集合 - 用于 HTML 内容的清洗和转换
 */

import * as cheerio from 'cheerio';

/**
 * 从 HTML 中提取纯文本
 * @param html - HTML 内容
 * @returns 纯文本内容
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return '';
  
  const $ = cheerio.load(html);
  
  // 移除脚本和样式元素
  $('script, style').remove();
  
  // 将换行标签替换为实际的换行
  $('br').replaceWith('\\n');
  $('p, div, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
    $(el).append('\\n');
  });
  
  // 提取并清理文本
  return $.text()
    .replace(/\\n{3,}/g, '\\n\\n') // 删除过多的连续换行
    .replace(/\\s+/g, ' ')        // 将多个空白字符替换为单个空格
    .trim();
}

/**
 * 从 HTML 中提取并格式化结构化内容
 * @param html - HTML 内容
 * @returns 格式化的文本
 */
export function extractFormattedContent(html: string): string {
  if (!html) return '';
  
  const $ = cheerio.load(html);
  
  // 移除脚本和样式元素
  $('script, style').remove();
  
  let result = '';
  
  // 处理标题
  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const level = parseInt(el.tagName.substring(1), 10);
    const prefix = '#'.repeat(level) + ' ';
    result += prefix + $(el).text().trim() + '\\n\\n';
  });
  
  // 处理段落
  $('p').each((i, el) => {
    result += $(el).text().trim() + '\\n\\n';
  });
  
  // 处理列表
  $('ul, ol').each((i, el) => {
    $(el).find('li').each((j, li) => {
      const prefix = $(el).is('ol') ? `${j+1}. ` : '- ';
      result += prefix + $(li).text().trim() + '\\n';
    });
    result += '\\n';
  });
  
  // 处理表格（简化表示）
  $('table').each((i, table) => {
    result += '【表格】\\n';
    $(table).find('tr').each((j, row) => {
      const cells = $(row).find('td, th').map((k, cell) => {
        return $(cell).text().trim();
      }).get().join(' | ');
      result += cells + '\\n';
    });
    result += '\\n';
  });
  
  // 处理链接
  $('a').each((i, link) => {
    const text = $(link).text().trim();
    const href = $(link).attr('href');
    if (text && href && !result.includes(`${text} (${href})`)) {
      result += `链接: ${text} (${href})\\n`;
    }
  });
  
  return result
    .replace(/\\n{3,}/g, '\\n\\n') // 删除过多的连续换行
    .trim();
}

/**
 * 从 HTML 中提取重要的元数据
 * @param html - HTML 内容
 * @returns 元数据对象
 */
export function extractMetadataFromHtml(html: string): Record<string, any> {
  if (!html) return {};
  
  const $ = cheerio.load(html);
  const metadata: Record<string, any> = {};
  
  // 尝试提取日期信息
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    
    // 尝试匹配日期模式
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
    const dates = text.match(datePattern);
    
    if (dates) {
      const nearbyText = text.substring(0, 30); // 获取日期附近的文本
      
      if (nearbyText.includes('due') || nearbyText.includes('deadline') || nearbyText.includes('截止')) {
        metadata.dueDate = dates[0];
      } else if (nearbyText.includes('start') || nearbyText.includes('begin') || nearbyText.includes('开始')) {
        metadata.startDate = dates[0];
      } else {
        if (!metadata.otherDates) metadata.otherDates = [];
        metadata.otherDates.push(dates[0]);
      }
    }
  });
  
  // 尝试提取百分比信息（可能表示分数权重）
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    const percentPattern = /\d+(\.\d+)?%/g;
    const percentages = text.match(percentPattern);
    
    if (percentages) {
      if (!metadata.percentages) metadata.percentages = [];
      metadata.percentages.push(...percentages);
    }
  });
  
  return metadata;
}

/**
 * 从 HTML 中提取课程材料的关键信息
 * @param html - HTML 内容
 * @returns 关键信息对象
 */
export function extractCourseMaterialInfo(html: string): {
  title?: string;
  description?: string;
  dueDate?: string;
  weight?: string;
  requirements?: string[];
} {
  if (!html) return {};
  
  const $ = cheerio.load(html);
  const result: {
    title?: string;
    description?: string;
    dueDate?: string;
    weight?: string;
    requirements?: string[];
  } = {};
  
  // 尝试提取标题
  $('h1, h2, h3, .page-header-headings h1').each((i, el) => {
    if (!result.title) {
      result.title = $(el).text().trim();
      return false; // 找到第一个标题后退出
    }
  });
  
  // 尝试提取描述
  $('.activity-description, .contentafterlink, .summary').each((i, el) => {
    if (!result.description) {
      result.description = $(el).text().trim();
      return false; // 找到第一个描述后退出
    }
  });
  
  // 查找截止日期
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('Due') || text.includes('截止日期') || text.includes('deadline')) {
      const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;
      const match = text.match(datePattern);
      if (match && !result.dueDate) {
        result.dueDate = match[0];
      }
    }
  });
  
  // 查找权重
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('weight') || text.includes('worth') || text.includes('分值') || text.includes('权重')) {
      const percentPattern = /\d+(\.\d+)?%/;
      const match = text.match(percentPattern);
      if (match && !result.weight) {
        result.weight = match[0];
      }
    }
  });
  
  // 查找要求
  const requirements: string[] = [];
  $('li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 200) { // 适当长度的列表项可能是要求
      requirements.push(text);
    }
  });
  
  if (requirements.length > 0) {
    result.requirements = requirements;
  }
  
  return result;
}