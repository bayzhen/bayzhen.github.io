---
layout: article
title: "Plugins与团队协作"
description: "打包分享你的超能力，团队协作最佳实践"
level: advanced
tags: ["高级", "7-10分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 9
prev:
  title: "Slash Commands"
  url: "/articles/claude-code/08-slash-commands.html"
---

## 开场

这个系列的最后一集。

前面我们学了Skills、Subagents、Hooks、Commands...

但有个问题：这些配置都在你自己电脑上。

**怎么分享给团队？**

答案是**Plugins**——把一切打包成可分享的能力包。

## Plugins是什么？

一个Plugin可以包含：

- 多个Skills
- 多个Subagents
- 多个Slash Commands
- 多个Hooks
- MCP服务器配置

安装一个Plugin，就获得了**整套能力**。

就像npm包，但是给Claude Code用的。

## 安装Plugin

```
# 安装
/plugins install typescript-lsp

# 列出已安装
/plugins list

# 更新
/plugins update

# 卸载
/plugins remove typescript-lsp
```

安装后，Plugin里的所有功能自动生效：

- Skills会按需加载
- Commands可以直接 `/xxx` 调用
- Hooks自动注册

## 社区资源

想找更多？去这个仓库：

**[awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)**

里面有：

- Skills集合
- Hook配方
- Subagent模板
- 完整工作流配置

都是社区贡献的，可以直接用或者作为参考。

## 团队协作最佳实践

### 1. 统一的CLAUDE.md

把项目规范、技术栈、开发流程都写进去：

```
# 项目说明

## 技术栈
- 前端：React + TypeScript
- 后端：Go + PostgreSQL

## 开发规范
- ESLint + Prettier
- Conventional Commits
- 分支命名：feature/xxx, fix/xxx

## 常用命令
npm run dev    # 开发
npm run test   # 测试
npm run build  # 构建
```

提交到Git，每个人都用同一份。

### 2. 项目级Skills

把团队的最佳实践写成Skills：

```
.claude/skills/
├── api-standards/SKILL.md
├── react-patterns/SKILL.md
└── testing-guide/SKILL.md
```

提交到Git，新人加入自动获得团队知识。

### 3. 共享Hooks

统一的质量门禁：

```
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...]
  }
}
```

`.claude/settings.json` 提交到Git。

### 4. GitHub Action自动化

```
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "审查这个PR，重点检查安全问题"
```

每个PR自动获得Claude的审查。

## 完整团队配置示例

```
my-project/
├── CLAUDE.md                      # 项目说明
├── .claude/
│   ├── settings.json              # Hooks配置
│   ├── commands/
│   │   ├── review.md
│   │   ├── test-this.md
│   │   └── deploy.md
│   ├── skills/
│   │   ├── api-standards/SKILL.md
│   │   └── react-patterns/SKILL.md
│   └── agents/
│       ├── code-reviewer.md
│       └── architect.md
├── .github/
│   └── workflows/
│       └── claude-review.yml      # PR自动审查
└── ...
```

全部提交到Git。新人clone项目，立刻获得完整的AI辅助开发环境。

## 系列总结

这个系列我们学了：

1. **入门**：安装、基础操作
2. **三种模式**：正常、计划、危险
3. **效率技巧**：10个实用技巧
4. **MCP**：连接外部服务
5. **Skills**：按需加载知识
6. **Subagents**：分身处理重任务
7. **Hooks**：自动化触发器
8. **Commands**：快捷指令
9. **Plugins**：打包分享

## 核心心法

> Claude Code不是要取代程序员，而是把程序员从繁琐的工作中解放出来。

以前我们是「写代码的人」，现在我们是「指挥写代码的人」。

重复性的工作、枯燥的样板代码、凌晨三点的debug——都可以交给它了。

你负责**思考**，它负责**执行**。

## 最后的话

记住一句话：

> **Always Be Clauding.**

这个工具会越来越强，学会用它，就是学会了一种新的工作方式。

## 快速参考

### 核心文件位置

| 文件 | 用途 |
| --- | --- |
| CLAUDE.md | 项目说明 |
| .claude/settings.json | Hooks配置 |
| .claude/commands/ | 快捷命令 |
| .claude/skills/ | 技能包 |
| .claude/agents/ | Subagents |

### 常用命令

| 命令 | 说明 |
| --- | --- |
| /help | 帮助 |
| /clear | 清空对话 |
| /hooks | 配置Hooks |
| /agents | 管理Subagents |
| /plugins | 管理插件 |

### 社区资源

- 官方文档：<https://code.claude.com/docs>
- awesome-claude-code：<https://github.com/hesreallyhim/awesome-claude-code>
