# Moodle AI Assistant (Cookie-based)

Moodle AI Assistant 是一个基于 Cookie 模拟登录的 Moodle 课程内容抓取和 AI 问答工具，让你可以轻松查询课程内容、作业要求、截止日期等信息，无需使用 Moodle API Token。

## 🌟 特性

- 🔐 **基于 Cookie 模拟登录**：无需申请 Moodle API Token，只需从浏览器复制现有的登录 Cookie
- 🕸️ **智能内容抓取**：自动抓取课程内容、作业要求、评分标准等
- 🧠 **本地知识库**：将课程内容存储在本地 SQLite 数据库中
- 🤖 **AI 智能问答**：使用 OpenAI GPT 模型解答关于课程的问题
- 💻 **友好的命令行界面**：简单易用的交互式问答体验

## 📋 先决条件

- Node.js v14.0.0 或更高版本
- npm 或 yarn 包管理器
- 有效的 OpenAI API 密钥
- 已登录 Moodle 的浏览器 Cookie

## 🛠️ 安装

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/moodle-ai-assistant.git
cd moodle-ai-assistant
```

2. 安装依赖：

```bash
npm install
```

3. 编译 TypeScript 代码：

```bash
npm run build
```

4. 配置环境变量（复制 .env.example 并编辑）：

```bash
cp .env.example .env
```

## ⚙️ 配置

### 1. 获取 Moodle Cookie

1. 使用浏览器（Chrome/Firefox/Safari）登录你的 Moodle 网站
2. 打开开发者工具（F12 或右键 -> 检查）
3. 切换到 Network（网络）选项卡
4. 刷新页面
5. 找到任意一个 Moodle 请求，查看其 Request Headers（请求标头）中的 Cookie
6. 复制 `MoodleSession=xxx` 部分

### 2. 编辑 .env 文件

在 .env 文件中填入以下信息：

```
# Moodle 配置
MOODLE_BASE_URL=https://your.moodle.site.edu
MOODLE_SESSION_COOKIE=your_moodle_session_cookie_here

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here

# 课程ID配置（可配置多个，英文逗号分隔）
COURSE_IDS=12345,67890

# 数据库和日志配置
DB_PATH=./data/knowledge.db
LOG_LEVEL=info
LOG_PATH=./logs

# 抓取配置
FETCH_DELAY=1000
FETCH_TIMEOUT=30000
```

## 🚀 使用方法

### 抓取课程内容

```bash
# 抓取所有配置的课程内容
npm run fetch

# 抓取特定课程内容
npm run fetch -- -c 12345

# 清除现有数据并重新抓取
npm run fetch -- --clean
```

### 询问课程相关问题

```bash
# 直接提问
npm run ask "midterm考试什么时候？"

# 指定课程提问
npm run ask "作业截止日期是什么时候？" -c 12345

# 进入交互式问答模式
npm run ask -i
```

## 💡 示例问题

- "数据结构与算法这门课的评分标准是什么？"
- "如何获得 Assignment 2 的高分？"
- "下一个截止日期是什么时候？"
- "期中考试会考哪些内容？"
- "请详细解释一下链表和数组的区别"

## 🔄 更新 Cookie

Moodle Session Cookie 通常会在一段时间后过期。当你收到认证错误时，需要重新获取新的 Cookie 并更新 .env 文件。

## 📝 注意事项

- 该工具仅供学习和个人使用
- 请遵守学校和 Moodle 的使用政策
- 抓取时请控制频率，避免对 Moodle 服务器造成过大负担
- 保管好你的 OpenAI API 密钥，避免额外费用

## 🤝 贡献

欢迎提交 Pull Requests 和 Issues！

## 📄 许可证

MIT License