---
layout: article
title: "快速入门"
description: "安装、启动、基础操作，3分钟上手AI编程助手"
level: beginner
tags: ["入门", "3-5分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 1
next:
  title: "三种工作模式"
  url: "/articles/claude-code/02-work-modes.html"
---

## 开场

你有没有过这种体验：深夜加班，面对一个诡异的bug，改了三小时，最后发现是少了个分号？

如果有，那今天介绍的工具可能会改变你的编程方式。

它叫**Claude Code**——一个住在终端里的AI编程助手。

## 它是什么？

用人话说：你雇了一个实习生，这个实习生：

- 能**看懂**你整个项目的代码
- 会**用**Git、npm、pip这些工具
- 能**写**代码、改代码、跑测试
- 你用**大白话**告诉它要干嘛就行

关键是——它不只是嘴上说说，**它真的会动手干活**。

## 安装（1分钟）

### Mac/Linux

```
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows（PowerShell）

```
irm https://claude.ai/install.ps1 | iex
```

### 验证安装

```
claude --version
```

前提：需要Claude Pro或Max订阅。

## 基础操作（2分钟）

### 启动

进入项目目录，输入一个字：

```
claude
```

### 第一次对话

试试这个：

```
解释一下这个项目是干什么的
```

Claude会自动扫描代码库，给你一个项目概述。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| /help | 显示帮助 |
| /clear | 清空对话 |
| /exit | 退出 |

### 快捷键

| 按键 | 功能 |
| --- | --- |
| Esc | 停止Claude |
| ↑ | 浏览历史对话 |
| Ctrl+V | 粘贴图片 |

## 它能干什么？

- **修Bug**：把报错丢给它，它自己找原因
- **写功能**：说"加个用户登录"，它从前端写到后端
- **重构**：祖传代码？它帮你理清楚
- **写文档**：不想写注释？它帮你补
- **Git操作**：提交、推送、创建PR，一句话搞定

## 小结

三分钟，你已经学会了：

1. 安装Claude Code
2. 启动并开始对话
3. 基本命令和快捷键

下一集，我们聊聊Claude Code的三种工作模式——这是高效使用的关键。
