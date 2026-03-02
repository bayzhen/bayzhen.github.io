---
layout: article
title: "MCP插件系统"
description: "给Claude Code装外挂，连接数据库、GitHub、浏览器等外部服务"
level: intermediate
tags: ["进阶", "5-7分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 4
prev:
  title: "效率技巧"
  url: "/articles/claude-code/03-efficiency-tips.html"
next:
  title: "Skills技能系统"
  url: "/articles/claude-code/05-skills.html"
---

## 开场

Claude Code本身已经很强了，但如果它能直接访问你的数据库、操作你的GitHub、甚至自动打开浏览器截图呢？

这就是**MCP**——Model Context Protocol，Claude Code的"外挂"系统。

## MCP是什么？

简单说：MCP是一种协议，让Claude能连接外部服务。

就像USB-C接口一样——有了统一标准，Claude就能接入各种"外设"。

```
Claude Code ←→ MCP协议 ←→ MCP服务器 ←→ 外部服务
```

## 快速上手

### 添加MCP服务器

```
# 添加文件系统访问
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/Documents ~/Desktop

# 添加Playwright（浏览器自动化）
claude mcp add playwright -- npx @playwright/mcp@latest

# 查看已安装的
claude mcp list

# 删除
claude mcp remove filesystem
```

### 管理MCP

```
claude mcp           # 交互式配置
claude mcp list      # 列出所有
claude mcp add       # 添加
claude mcp remove    # 删除
```

## 实用MCP推荐

| MCP服务 | 用途 |
| --- | --- |
| filesystem | 访问指定目录 |
| playwright | 浏览器自动化 |
| github | 操作GitHub仓库 |
| postgres | 直接查询数据库 |

## 实战案例：Playwright自动化

有了Playwright MCP，Claude可以：

1. 自动打开浏览器
2. 渲染你的页面
3. 截图并分析
4. 告诉你哪里需要改

**工作流示例**：

```
> 打开 http://localhost:3000 并截图

Claude: [使用Playwright打开浏览器，截图]

> 这个页面的按钮对齐有问题，帮我修一下

Claude: [分析截图，修改CSS，再次截图验证]
```

完全的**自动化反馈循环**。你甚至不用切换到浏览器。

## MCP配置文件

MCP配置存储在两个地方：

- 全局：`~/.claude.json`
- 项目级：`.mcp.json`（项目根目录）

示例配置：

```
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/Documents"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## 注意事项

1. **每个MCP都消耗上下文**：用 `/context` 查看消耗，删掉不用的MCP
2. **安全考虑**：MCP能访问外部服务，注意权限控制
3. **按需启用**：不是越多越好，用到什么装什么

## 小结

MCP让Claude Code从一个"代码助手"变成了一个"万能助手"：

- 连接数据库
- 操作GitHub
- 自动化浏览器
- 访问任何支持MCP的服务

下一集，我们聊**Skills**——让Claude按需加载专业知识，就像《黑客帝国》里的Neo一样。
