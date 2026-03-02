---
layout: article
title: "Slash Commands快捷指令"
description: "一键触发工作流，把常用prompt存成快捷命令"
level: advanced
tags: ["高级", "5-7分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 8
prev:
  title: "Hooks自动化"
  url: "/articles/claude-code/07-hooks.html"
next:
  title: "Plugins与团队协作"
  url: "/articles/claude-code/09-plugins.html"
---

## 开场

前几集我们学了很多功能：Skills、Subagents、Hooks...

但每次都要打一大段话来触发它们，有点麻烦。

有没有办法**一键执行**？

有。这就是**Slash Commands**——你的私人快捷指令。

## Slash Commands是什么？

简单说：**把常用的prompt存成快捷命令**。

比如你经常需要"检查代码风格并修复"，与其每次都打：

```
请检查整个项目的代码风格，用ESLint扫描，自动修复可以修复的问题，
对于无法自动修复的问题，列出来并给出修改建议。
```

不如创建一个命令：

```
/lint-fix
```

一敲就执行。

## 创建自定义命令

### 目录位置

- 全局：`~/.claude/commands/`
- 项目：`.claude/commands/`

### 创建命令

创建 `~/.claude/commands/lint-fix.md`：

```
运行ESLint检查整个项目，自动修复可以修复的问题。
对于无法自动修复的问题，列出来并给出修改建议。
```

搞定。现在输入 `/lint-fix` 就会执行这个指令。

## 实用命令示例

### /review - 代码审查

```
审查当前分支相对于main的所有改动。

检查：
1. 潜在的bug
2. 安全隐患
3. 性能问题
4. 代码风格

生成一份审查报告。
```

### /test-this - 给当前文件写测试

```
为我当前打开的文件编写单元测试。

要求：
- 使用项目现有的测试框架
- 覆盖主要功能和边界情况
- 遵循AAA模式（Arrange-Act-Assert）
```

### /commit - 智能提交

```
查看当前的git改动，生成符合Conventional Commits规范的提交信息，
然后执行提交。

如果改动涉及多个主题，询问我是否要拆分成多个提交。
```

### /explain - 解释代码

```
解释我选中的代码或当前文件：

1. 这段代码的作用是什么？
2. 关键逻辑是什么？
3. 有没有需要注意的地方？

用简单的语言，假设我是刚接手这个项目的人。
```

## 进阶：命令调用Subagent

你可以让命令启动特定的subagent：

```
# /deep-review

启动 code-reviewer subagent，对当前修改的文件进行深度安全审查。

审查完成后，生成一份报告，包含：
1. 发现的问题列表
2. 风险评级
3. 修复优先级建议
```

现在 `/deep-review` 就是一个**一键触发完整工作流**的命令。

## 进阶：命令带参数

命令可以接受参数：

创建 `/new-feature.md`：

```
为 $ARGUMENTS 创建一个新功能分支，然后：

1. 切换到新分支
2. 创建基础文件结构
3. 编写初始代码骨架
4. 创建对应的测试文件
```

使用：

```
/new-feature 用户登录
```

`$ARGUMENTS` 会被替换成"用户登录"。

## Commands vs Skills

| 特性 | Commands | Skills |
| --- | --- | --- |
| 触发方式 | 手动输入/xxx | Claude自动判断 |
| 适合场景 | 重复性动作 | 领域知识 |

**经验法则**：

- "做某件事"的动作 → Command
- "如何做某件事"的知识 → Skill

## 我的常用命令集

| 命令 | 用途 |
| --- | --- |
| /lint-fix | 检查并修复代码风格 |
| /review | 审查当前改动 |
| /test-this | 给当前文件写测试 |
| /commit | 智能提交 |
| /explain | 解释代码 |
| /refactor | 重构选中的代码 |
| /doc | 生成文档 |
| /debug | 分析错误日志 |

这些命令存在 `~/.claude/commands/` 里，每个项目都能用。

## 把它们组合起来

现在你有了所有积木：

- **CLAUDE.md**：项目基础信息
- **Skills**：按需加载的专业知识
- **Subagents**：独立执行的分身
- **Hooks**：自动触发的规则
- **Commands**：一键执行的快捷方式

### 完整工作流示例

```
# 1. 开始新功能
/new-feature 微信登录

# 2. Claude进入计划模式，讨论方案
(Shift+Tab切换)

# 3. 开始编码
（Claude写代码，PostToolUse Hook自动格式化）

# 4. 写测试
/test-this

# 5. 审查
/review

# 6. 提交
/commit
```

整个流程行云流水，大部分重复工作都自动化了。

## 小结

Slash Commands是胶水，把所有高级功能粘在一起：

- 存储常用prompt
- 一键触发复杂工作流
- 调用Subagent
- 接受参数

最后一集，我们聊聊如何把这些都**打包分享**给团队——Plugins系统。
