import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

// 加载 .env 文件
dotenv.config();

// 配置类型定义
export interface MoodleConfig {
  token: string;
  baseUrl: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export interface CourseConfig {
  id: string;
  name: string;
  term: string;
}

export interface Config {
  moodle: MoodleConfig;
  openai: OpenAIConfig;
  courses: CourseConfig[];
  dbPath: string;
  logLevel: string;
}

// 从环境变量或 auth.json 文件获取配置
const loadConfig = (): Config => {
  // 默认配置
  const defaultConfig: Config = {
    moodle: {
      token: process.env.MOODLE_TOKEN || '',
      baseUrl: process.env.MOODLE_URL || 'https://moodle.telt.unsw.edu.au',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    courses: [],
    dbPath: process.env.DB_PATH || './data/knowledge.db',
    logLevel: process.env.LOG_LEVEL || 'info',
  };

  // 尝试从 auth.json 加载配置
  try {
    const authPath = path.join(__dirname, 'auth.json');
    if (fs.existsSync(authPath)) {
      const authJson = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      
      // 合并配置
      defaultConfig.moodle.token = authJson.moodle?.token || defaultConfig.moodle.token;
      defaultConfig.moodle.baseUrl = authJson.moodle?.baseUrl || defaultConfig.moodle.baseUrl;
      defaultConfig.openai.apiKey = authJson.openai?.apiKey || defaultConfig.openai.apiKey;
      defaultConfig.openai.model = authJson.openai?.model || defaultConfig.openai.model;
      
      // 如果 auth.json 中有课程配置，优先使用
      if (authJson.courses && Array.isArray(authJson.courses)) {
        defaultConfig.courses = authJson.courses;
      }
    }
  } catch (error) {
    logger.warn('无法加载 auth.json 配置文件，将使用环境变量');
  }

  // 如果环境变量中有课程 ID 列表但 auth.json 中没有课程配置
  if (defaultConfig.courses.length === 0 && process.env.COURSE_IDS) {
    const courseIds = process.env.COURSE_IDS.split(',');
    defaultConfig.courses = courseIds.map(id => ({
      id: id.trim(),
      name: `Course ${id}`,
      term: 'Unknown',
    }));
  }

  // 验证必要的配置
  if (!defaultConfig.moodle.token) {
    logger.error('未配置 Moodle token，请在 .env 或 auth.json 中设置');
  }

  return defaultConfig;
};

export const config = loadConfig();