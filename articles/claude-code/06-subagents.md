---
layout: article
title: "Subagents分身术"
description: "上下文隔离，让Claude同时处理多个任务而不乱套"
level: intermediate
tags: ["进阶", "5-7分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 6
prev:
  title: "Skills技能系统"
  url: "/articles/claude-code/05-skills.html"
next:
  title: "Hooks自动化"
  url: "/articles/claude-code/07-hooks.html"
---

## 开场

你有没有遇到过这种情况：

让Claude分析一个大项目，它读了一堆文件，结果对话框被撑爆了，前面聊的内容全忘了。

这是因为AI有"上下文窗口"限制。装太多东西，就会挤掉旧的东西。

解决方案？**分身术**。

## Subagents是什么？

想象Claude是一个项目经理。有时候，它不需要亲自干所有活，而是可以派出"分身"去执行特定任务。

**Subagent** = 独立的Claude实例，有自己的上下文窗口，专注于单一任务。

## 为什么需要它？

假设你让Claude分析一个10万行的代码库：

**没有Subagent**：

- Claude在主对话里读了10万行
- 上下文被撑爆
- 重要信息被噪音淹没
- 你前面说的话它都忘了

**有Subagent**：

- 派一个分身去扫描代码库
- 分身积累10万字的分析
- 只把**结论**（几百字）返回给主对话
- 主对话保持清爽，专注于决策

这就是Subagent的核心价值：**隔离上下文，只传递结果**。

## 内置Subagents

Claude Code自带几种subagent：

| Subagent | 用途 |
| --- | --- |
| Explore | 探索代码库，返回结构摘要 |
| Task | 执行独立任务 |
| claude-code-guide | 查询Claude Code官方文档 |

当你在计划模式说"先探索一下这个项目"，Claude就会启动Explore subagent。

你会看到类似这样的提示：

```
Task(Explore: 分析项目结构)... running in background
```

## 创建自定义Subagent

运行 `/agents` 命令，或手动创建文件。

### 目录位置

- 全局：`~/.claude/agents/`
- 项目：`.claude/agents/`

### 示例：代码审查员

创建 `~/.claude/agents/code-reviewer.md`：

```
---
name: code-reviewer
description: 专业代码审查员，专注于发现bug和安全问题
model: sonnet
tools:
  - Read
  - Grep
  - Glob
---

你是一个资深代码审查员。审查代码时：

1. 首先检查安全漏洞
   - SQL注入
   - XSS
   - 认证绕过

2. 然后检查逻辑错误和边界情况

3. 最后检查性能问题

对于每个问题，说明：
- 问题所在（具体文件和行号）
- 风险级别（高/中/低）
- 修复建议
```

### 使用方式

```
用code-reviewer检查一下auth模块
```

Claude会派出这个专门的审查员subagent，用它自己的上下文深入分析，然后把结论报告给你。

## 实用Subagent示例

### 架构师

```
---
name: architect
description: 系统架构师，负责设计和评审架构
model: opus
tools:
  - Read
  - Grep
---

你是一个系统架构师。分析架构时关注：
- 模块划分是否合理
- 依赖关系是否清晰
- 是否存在循环依赖
- 扩展性和可维护性
```

### 文档专家

```
---
name: doc-writer
description: 技术文档专家
model: sonnet
tools:
  - Read
  - Write
---

你是一个技术文档专家。写文档时：
- 结构清晰，层次分明
- 包含代码示例
- 面向实际使用场景
```

## 异步Subagent

更酷的是，subagent可以在**后台运行**：

```
帮我用后台agent分析整个项目的依赖关系
```

Claude会启动一个异步subagent。你可以继续做其他事，完成后它会通知你。

你会看到：

```
Task(分析依赖关系)... running in background
```

继续你的对话，等它完成后结果会自动出现。

## 小结

Subagents解决了一个核心问题：**上下文管理**。

- 重任务 → 派分身去做
- 分身做完 → 只返回结论
- 主对话 → 保持清爽

下一集，我们聊**Hooks**——Claude Code的自动化触发器，让特定操作自动执行。
