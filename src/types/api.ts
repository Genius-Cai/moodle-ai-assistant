// Moodle API响应类型定义

export interface MoodleApiResponse<T> {
  data: T;
  warnings?: MoodleWarning[];
}

export interface MoodleWarning {
  item: string;
  itemid: number;
  warningcode: string;
  message: string;
}

// 课程相关类型
export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  summaryformat: number;
  startdate: number;
  enddate: number;
  visible: boolean;
}

// 公告相关类型
export interface MoodleForum {
  id: number;
  course: number;
  name: string;
  intro: string;
  introformat: number;
  type: string;
}

export interface MoodleForumDiscussion {
  id: number;
  forum: number;
  name: string;
  subject: string;
  message: string;
  messageformat: number;
  timemodified: number;
  userid: number;
  created: number;
  modified: number;
}

export interface MoodleForumPost {
  id: number;
  discussion: number;
  parent: number;
  userid: number;
  subject: string;
  message: string;
  messageformat: number;
  created: number;
  modified: number;
  attachment: string;
}

// 作业相关类型
export interface MoodleAssignment {
  id: number;
  course: number;
  name: string;
  intro: string;
  introformat: number;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  gradingduedate: number;
  cutoffdate: number;
}

// 知识库数据类型
export interface KnowledgeItem {
  id?: number;
  courseId: string;
  type: 'announcement' | 'assignment' | 'qa' | 'resource';
  title: string;
  content: string;
  metadata: string;  // JSON字符串，存储额外信息
  source: string;    // 来源，如"moodle", "edstem"
  sourceId: string;  // 来源系统中的ID
  created: number;   // 时间戳
  modified: number;  // 时间戳
  embedding?: string; // 向量嵌入（可选，用于语义搜索）
}