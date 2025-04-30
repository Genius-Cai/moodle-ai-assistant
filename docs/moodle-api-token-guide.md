# Moodle API Token 获取指南

这个文档提供了在Moodle系统中手动创建和获取API Token的步骤。

## 为什么需要Moodle API Token

Moodle API Token是与Moodle系统进行API交互的必要凭证。这个Token允许第三方应用程序（如我们的Moodle AI Assistant）代表您访问Moodle中的内容。

## 方法一：学生账户手动申请API Token

如果您是学生，您可能需要通过以下步骤获取API Token：

1. 登录到您的Moodle账户
2. 点击右上角的个人资料
3. 寻找并点击"偏好设置"或"首选项"
4. 查找"安全密钥"、"API密钥"或类似选项
5. 如果有"创建新密钥"或"生成API密钥"选项，请点击它
6. 输入密钥描述（例如"Moodle AI Assistant"）
7. 选择所需的权限或服务（如果提示）
8. 生成并复制API Token

## 方法二：咨询Moodle管理员

如果您找不到创建API Token的选项，您可能需要联系您学校的Moodle管理员：

1. 联系您学校的IT支持或Moodle管理员
2. 说明您需要一个具有以下权限的Moodle Web服务API Token：
   - course_content（获取课程内容）
   - core_course（访问课程信息）
   - core_user（访问用户信息）
   - mod_forum（访问论坛内容）
   - mod_assign（访问作业内容）
3. 说明这个Token将用于您的学习助手项目

## 方法三：若有管理员权限

如果您是Moodle管理员，可以通过以下步骤创建API Token：

1. 登录Moodle管理员账户
2. 前往"站点管理" > "插件" > "Web服务" > "外部服务"
3. 添加一个新的外部服务（例如"Moodle AI Assistant"）
4. 为该服务添加所需功能（如上述列出的权限）
5. 前往"站点管理" > "插件" > "Web服务" > "管理令牌"
6. 创建一个新的令牌，选择您刚创建的服务和相应的用户
7. 复制生成的令牌

## 使用API Token

获取API Token后，在项目的`.env`文件中更新以下配置：

```
MOODLE_BASE_URL=https://moodle.telt.unsw.edu.au
MOODLE_TOKEN=您的实际API Token
```

## 可能的错误和解决方案

如果在使用API Token时遇到问题，以下是一些常见错误和解决方案：

1. **"无效的令牌"错误**：确保Token正确复制且未过期
2. **"权限不足"错误**：联系管理员为您的Token添加所需权限
3. **"服务不可用"错误**：确认您的Moodle实例已启用Web服务

## 检查Token是否有效

您可以通过以下方式验证Token是否有效：

```
curl "https://moodle.telt.unsw.edu.au/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

如果返回您的用户信息，则Token有效。

## 注意事项

- API Token含有敏感信息，请妥善保管
- 一些学校的Moodle可能限制API访问，需要特殊申请
- 定期更新Token以提高安全性