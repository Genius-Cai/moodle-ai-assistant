import { chromium } from 'playwright';

/**
 * 自动抓取Moodle API Token的脚本
 * 使用方法：
 * 1. 运行脚本
 * 2. 在打开的浏览器窗口中输入你的登录凭据
 * 3. 登录后，点击课程、公告等内容以触发API请求
 * 4. 控制台会显示找到的token
 */
export async function extractMoodleToken(
  moodleUrl: string,
  zid?: string,
  password?: string
) {
  console.log('🚀 启动Moodle Token提取工具...');
  console.log(`📡 目标Moodle网站: ${moodleUrl}`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 使用Set存储所有捕获的token，避免重复打印
  const foundTokens = new Set<string>();
  
  // 记录最近的请求，用于调试
  const recentRequests: string[] = [];
  const MAX_RECENT_REQUESTS = 5;
  
  // 监听所有网络请求，扩大捕获范围
  await page.route('**/*', (route, request) => {
    const url = request.url();
    
    // 将最近的请求添加到列表中，用于调试
    recentRequests.push(url);
    if (recentRequests.length > MAX_RECENT_REQUESTS) {
      recentRequests.shift();
    }
    
    // 尝试几种可能包含token的模式
    const patterns = [
      /wstoken=([^&]+)/, // 标准的webservice token
      /token=([^&]+)/, // 一般的token参数
      /api[Tt]oken=([^&]+)/, // apiToken参数
      /key=([^&]+)/ // key参数，有时候用作API密钥
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && !foundTokens.has(match[1])) {
        foundTokens.add(match[1]);
        console.log('✅ Token已找到:', match[1]);
        console.log(`   在URL: ${url.substring(0, 100)}...`);
      }
    }
    
    route.continue();
  });
  
  await page.goto(moodleUrl);
  
  // 如果提供了凭据，则自动填写并提交
  if (zid && password) {
    console.log('👤 使用提供的凭据自动登录...');
    await page.fill('#username', zid);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
  } else {
    console.log('⚠️ 请在浏览器窗口中手动登录');
  }
  
  console.log('⏳ 请在浏览器中导航和点击内容以触发API请求');
  console.log('💡 提示: 尝试访问课程内容、作业、论坛等功能');
  
  // 每30秒显示当前状态
  const intervalId = setInterval(() => {
    console.log(`\n⌛ 已监听到 ${foundTokens.size} 个token`);
    if (recentRequests.length > 0) {
      console.log('最近的几个请求:');
      recentRequests.forEach((url, i) => {
        console.log(`${i + 1}. ${url.substring(0, 80)}...`);
      });
    }
    console.log('继续浏览不同的页面以触发更多API请求...\n');
  }, 30000);
  
  // 等待5分钟，让用户有足够的时间浏览网站和触发API请求
  await page.waitForTimeout(5 * 60 * 1000);
  
  // 清除状态更新定时器
  clearInterval(intervalId);
  
  // 脚本结束前，总结所有找到的token
  if (foundTokens.size > 0) {
    console.log('\n🔑 找到的所有Token:');
    foundTokens.forEach(token => {
      console.log(`- ${token}`);
    });
    console.log(`\n共找到 ${foundTokens.size} 个不同的Token`);
  } else {
    console.log('\n❌ 未找到任何Token，请尝试以下步骤:');
    console.log('1. 确保您已经完全登录到Moodle系统');
    console.log('2. 访问课程内容、作业、论坛等功能');
    console.log('3. 尝试在Moodle中的"偏好设置"中查找"API密钥"或"安全密钥"选项');
    console.log('4. 检查您的账户是否有使用API的权限');
  }
  
  await browser.close();
  console.log('👋 Token提取工具已关闭');
}

// 如果直接运行这个文件，则执行token提取
if (require.main === module) {
  const moodleUrl = process.argv[2] || 'https://moodle.telt.unsw.edu.au';
  const zid = process.argv[3];
  const password = process.argv[4];
  
  extractMoodleToken(moodleUrl, zid, password)
    .catch(console.error);
}