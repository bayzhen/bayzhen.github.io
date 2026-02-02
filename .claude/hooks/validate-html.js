#!/usr/bin/env node

/**
 * HTML 验证钩子
 * 检查 HTML 文件是否符合本站规范
 */

const fs = require('fs');
const path = require('path');

const filePath = process.env.CLAUDE_FILE_PATH;

if (!filePath || !filePath.endsWith('.html')) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  // 检查必要元素
  if (!content.includes('lang="zh-CN"')) {
    warnings.push('建议添加 lang="zh-CN" 属性');
  }

  if (!content.includes('<nav>')) {
    errors.push('缺少导航栏 <nav>');
  }

  if (!content.includes('首页') || !content.includes('简历') || !content.includes('文章')) {
    warnings.push('导航栏可能不完整，应包含：首页、简历、文章');
  }

  if (!content.includes('<title>') || !content.includes('- 陈栢成</title>')) {
    warnings.push('标题格式应为: <title>页面标题 - 陈栢成</title>');
  }

  if (!content.includes('@media')) {
    warnings.push('缺少响应式样式 (@media)');
  }

  // 输出结果
  if (errors.length > 0) {
    console.log('HTML验证错误:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
  }

  if (warnings.length > 0) {
    console.log('HTML验证警告:');
    warnings.forEach(w => console.log(`  ⚠️ ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ HTML验证通过');
  }

  // 只有错误才阻止操作
  process.exit(errors.length > 0 ? 1 : 0);

} catch (err) {
  console.error('验证失败:', err.message);
  process.exit(0); // 不阻止操作
}
