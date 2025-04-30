import axios, { AxiosInstance } from 'axios';
import { config } from '../config/settings';
import { logger } from '../utils/logger';
import { 
  MoodleApiResponse, 
  MoodleCourse, 
  MoodleForum, 
  MoodleForumDiscussion, 
  MoodleForumPost, 
  MoodleAssignment 
} from '../types/api';

/**
 * Moodle API 抓取器
 * 负责与 Moodle API 交互，获取课程信息、公告、作业等数据
 */
export class MoodleApiFetcher {
  private axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly wstoken: string;

  constructor(baseUrl: string = config.moodle.baseUrl, token: string = config.moodle.token) {
    this.baseUrl = baseUrl;
    this.wstoken = token;

    // 创建 axios 实例，用于所有 API 请求
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        wstoken: this.wstoken,
        moodlewsrestformat: 'json',
      },
    });

    logger.info('MoodleApiFetcher 初始化完成');
  }

  /**
   * 获取课程信息
   * @param courseId 课程ID
   * @returns 课程信息
   */
  async getCourseInfo(courseId: string): Promise<MoodleCourse | null> {
    try {
      const response = await this.axiosInstance.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'core_course_get_courses',
          'options[ids][0]': courseId,
        },
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        logger.info(`成功获取课程信息: ${courseId}`);
        return response.data[0] as MoodleCourse;
      } else {
        logger.warn(`未找到课程: ${courseId}`);
        return null;
      }
    } catch (error) {
      logger.error(`获取课程信息失败: ${courseId}`, { error });
      throw new Error(`获取课程信息失败: ${error}`);
    }
  }

  /**
   * 获取课程公告板
   * @param courseId 课程ID
   * @returns 公告板信息列表
   */
  async getCourseForums(courseId: string): Promise<MoodleForum[]> {
    try {
      const response = await this.axiosInstance.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_forum_get_forums_by_courses',
          'courseids[0]': courseId,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        logger.info(`成功获取课程公告板: ${courseId}, 共 ${response.data.length} 个`);
        return response.data as MoodleForum[];
      } else {
        logger.warn(`未找到课程公告板: ${courseId}`);
        return [];
      }
    } catch (error) {
      logger.error(`获取课程公告板失败: ${courseId}`, { error });
      throw new Error(`获取课程公告板失败: ${error}`);
    }
  }

  /**
   * 获取论坛讨论内容
   * @param forumId 论坛ID
   * @returns 论坛讨论内容列表
   */
  async getForumDiscussions(forumId: string): Promise<MoodleForumDiscussion[]> {
    try {
      const response = await this.axiosInstance.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_forum_get_forum_discussions',
          forumid: forumId,
          sortby: 'timemodified',
          sortdirection: 'DESC',
          page: 0,
          perpage: 100, // 获取最近100条讨论
        },
      });

      if (response.data && response.data.discussions && Array.isArray(response.data.discussions)) {
        logger.info(`成功获取论坛讨论: ${forumId}, 共 ${response.data.discussions.length} 条`);
        return response.data.discussions as MoodleForumDiscussion[];
      } else {
        logger.warn(`未找到论坛讨论: ${forumId}`);
        return [];
      }
    } catch (error) {
      logger.error(`获取论坛讨论失败: ${forumId}`, { error });
      throw new Error(`获取论坛讨论失败: ${error}`);
    }
  }

  /**
   * 获取讨论中的帖子
   * @param discussionId 讨论ID
   * @returns 帖子列表
   */
  async getDiscussionPosts(discussionId: string): Promise<MoodleForumPost[]> {
    try {
      const response = await this.axiosInstance.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_forum_get_discussion_posts',
          discussionid: discussionId,
          sortby: 'created',
          sortdirection: 'ASC',
        },
      });

      if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
        logger.info(`成功获取讨论帖子: ${discussionId}, 共 ${response.data.posts.length} 条`);
        return response.data.posts as MoodleForumPost[];
      } else {
        logger.warn(`未找到讨论帖子: ${discussionId}`);
        return [];
      }
    } catch (error) {
      logger.error(`获取讨论帖子失败: ${discussionId}`, { error });
      throw new Error(`获取讨论帖子失败: ${error}`);
    }
  }

  /**
   * 获取课程作业列表
   * @param courseId 课程ID
   * @returns 作业列表
   */
  async getCourseAssignments(courseId: string): Promise<MoodleAssignment[]> {
    try {
      const response = await this.axiosInstance.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_assign_get_assignments',
          'courseids[0]': courseId,
        },
      });

      if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
        const course = response.data.courses.find((c: any) => c.id.toString() === courseId);
        if (course && course.assignments) {
          logger.info(`成功获取课程作业: ${courseId}, 共 ${course.assignments.length} 个`);
          return course.assignments as MoodleAssignment[];
        }
      }

      logger.warn(`未找到课程作业: ${courseId}`);
      return [];
    } catch (error) {
      logger.error(`获取课程作业失败: ${courseId}`, { error });
      throw new Error(`获取课程作业失败: ${error}`);
    }
  }

  /**
   * 获取课程所有公告内容
   * @param courseId 课程ID
   * @returns 所有公告内容，包含标题和内容
   */
  async getAllAnnouncements(courseId: string): Promise<Array<{title: string, content: string, created: number, id: string}>> {
    try {
      // 1. 获取所有公告板
      const forums = await this.getCourseForums(courseId);
      
      // 2. 找到公告板（通常名称包含"公告"或"Announcements"）
      const announcementForums = forums.filter(forum => 
        forum.name.toLowerCase().includes('公告') || 
        forum.name.toLowerCase().includes('announcements') ||
        forum.name.toLowerCase().includes('announcement') ||
        forum.type === 'news'
      );
      
      if (announcementForums.length === 0) {
        logger.warn(`未找到公告板, 将使用所有论坛: ${courseId}`);
      }
      
      // 使用找到的公告板或所有论坛
      const forumsToFetch = announcementForums.length > 0 ? announcementForums : forums;

      // 3. 获取所有公告内容
      const allAnnouncements = [];
      
      for (const forum of forumsToFetch) {
        // 获取论坛所有讨论
        const discussions = await this.getForumDiscussions(forum.id.toString());
        
        for (const discussion of discussions) {
          // 获取讨论中的所有帖子
          const posts = await this.getDiscussionPosts(discussion.id.toString());
          
          // 处理主贴
          if (posts.length > 0) {
            const mainPost = posts[0]; // 第一个帖子通常是公告内容
            allAnnouncements.push({
              title: mainPost.subject,
              content: mainPost.message,
              created: mainPost.created,
              id: `forum_${forum.id}_discussion_${discussion.id}_post_${mainPost.id}`
            });
          }
        }
      }

      logger.info(`成功获取课程所有公告: ${courseId}, 共 ${allAnnouncements.length} 条`);
      return allAnnouncements;
    } catch (error) {
      logger.error(`获取课程所有公告失败: ${courseId}`, { error });
      throw new Error(`获取课程所有公告失败: ${error}`);
    }
  }

  /**
   * 获取课程的所有作业详情
   * @param courseId 课程ID
   * @returns 所有作业详情
   */
  async getAllAssignments(courseId: string): Promise<Array<{title: string, content: string, dueDate: number, id: string}>> {
    try {
      const assignments = await this.getCourseAssignments(courseId);
      
      const assignmentDetails = assignments.map(assignment => ({
        title: assignment.name,
        content: assignment.intro,
        dueDate: assignment.duedate,
        id: `assignment_${assignment.id}`
      }));

      logger.info(`成功获取课程所有作业: ${courseId}, 共 ${assignmentDetails.length} 个`);
      return assignmentDetails;
    } catch (error) {
      logger.error(`获取课程所有作业失败: ${courseId}`, { error });
      throw new Error(`获取课程所有作业失败: ${error}`);
    }
  }

  /**
   * 获取课程所有内容（公告和作业）
   * @param courseId 课程ID
   * @returns 所有课程内容
   */
  async getAllCourseContent(courseId: string) {
    try {
      // 并行获取公告和作业
      const [announcements, assignments] = await Promise.all([
        this.getAllAnnouncements(courseId),
        this.getAllAssignments(courseId)
      ]);

      logger.info(`成功获取课程所有内容: ${courseId}, 共 ${announcements.length + assignments.length} 项`);
      
      return {
        announcements,
        assignments
      };
    } catch (error) {
      logger.error(`获取课程所有内容失败: ${courseId}`, { error });
      throw new Error(`获取课程所有内容失败: ${error}`);
    }
  }
}