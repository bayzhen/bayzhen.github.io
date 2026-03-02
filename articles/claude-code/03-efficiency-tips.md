---
layout: article
title: "效率技巧"
description: "10个让效率翻倍的实用技巧，从入门到真香"
level: beginner
tags: ["入门", "8-10分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 3
prev:
  title: "三种工作模式"
  url: "/articles/claude-code/02-work-modes.html"
next:
  title: "MCP插件系统"
  url: "/articles/claude-code/04-mcp.html"
---

## 开场

Claude Code用得好不好，往往取决于你知不知道这些"小窍门"。

今天分享10个我亲测有效的效率技巧，每一个都能帮你省时间。

## 1叹号直接执行命令

不想等Claude帮你跑命令？自己来：

```
!git status
!npm test
!tail -50 error.log
```

叹号开头 = 直接执行bash命令。

**好处**：不消耗AI的tokens，速度更快，结果直接注入上下文。

## 2井号写入记忆

想让Claude永久记住某些事？用井号开头：

```
# 这个项目用pnpm，不要用npm
# API地址是 https://api.example.com/v2
# 测试命令是 pytest -v --cov
```

Claude会问你保存到哪里，然后它就**永远记住了**。

下次启动，不用再说一遍。

## 3CLAUDE.md——项目说明书

在项目根目录创建 `CLAUDE.md`：

```
# 项目说明

## 技术栈
- 前端：React + TypeScript
- 后端：Node.js + Express

## 开发规范
- 使用ESLint + Prettier
- 提交信息遵循Conventional Commits

## 常用命令
- `npm run dev` 启动开发
- `npm run test` 运行测试
```

Claude每次启动都会读这个文件。写得越详细，它干活越靠谱。

## 4拖图进去当参考

设计稿来了？直接把图片拖进终端：

```
[拖入设计稿]
按照这个设计稿实现登录页面
```

Claude能"看"图片，然后写出对应的代码。UI还原度相当高。

## 5截图反馈，快速迭代

1. 让Claude写一个页面
2. 在浏览器打开
3. 截图（Mac: `Cmd+Ctrl+Shift+4`）
4. 粘贴到Claude（`Ctrl+V`，不是Cmd+V）
5. 说："这个按钮应该是蓝色的"

这种**视觉反馈循环**，比用文字描述问题快10倍。

## 6think harder魔法词

遇到复杂问题？加上这些魔法词：

| 关键词 | 效果 |
| --- | --- |
| think | 启用扩展思考 |
| think hard | 更深入思考 |
| think harder | 深度分析 |
| ultrathink | 最高级别思考 |

例如：

```
ultrathink: 审查这个架构，找出潜在的扩展性问题
```

思考越深，分析越透彻。复杂问题值得这样做。

## 7并行跑多个实例

开三个终端：

- 终端1：Claude在写API接口
- 终端2：Claude在写前端组件
- 终端3：Claude在写测试用例

三个任务并行进行。**就像有了三个程序员同时干活**。

小贴士：确保它们在操作不同的文件，避免冲突。

## 8会话管理

给对话起个名字：

```
/rename auth-refactor
```

下次想继续：

```
/resume auth-refactor
```

再也不用从头开始解释上下文了。

## 9管道操作

Claude Code是命令行工具，可以这样用：

```
# 分析Git变更
git diff | claude -p "解释这些改动"

# 分析错误日志
cat error.log | claude -p "诊断这个错误"

# 直接执行并退出
claude -p "这个项目有多少行代码？"
```

`-p` = print mode，不进入交互界面，直接输出结果。适合写脚本。

## 10让Claude自动审查PR

```
/install-github-app
```

之后，每次你提PR，Claude会自动Review。

它不会像人类同事那样挑变量命名，而是**真正找Bug和安全隐患**。

## 小结速查表

| 技巧 | 用法 |
| --- | --- |
| 直接执行命令 | !command |
| 写入记忆 | # 要记住的事 |
| 项目说明 | 创建CLAUDE.md |
| 图片参考 | 拖入或Ctrl+V |
| 深度思考 | ultrathink: 问题 |
| 并行任务 | 开多个终端 |
| 会话管理 | /rename+/resume |
| 管道操作 | git diff | claude -p "..." |

下一集，我们聊聊MCP——Claude Code的"外挂"系统，让它能连接更多外部服务。
