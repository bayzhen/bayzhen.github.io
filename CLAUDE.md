# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 项目规范 - bayzhen.github.io

这是一个 GitHub Pages 个人技术博客网站，使用 Jekyll 构建。`Main` 分支自动部署到 GitHub Pages。

## 技术栈

- Jekyll（GitHub Pages 原生支持），Markdown + Liquid 模板
- 共享 CSS：`assets/css/main.css`（不要内联 CSS，特殊交互页面除外）
- Markdown 语法高亮：kramdown + rouge

## 目录结构

```
/
├── _config.yml              # Jekyll 配置
├── _layouts/                # 页面布局模板
│   ├── default.html         # 基础布局（nav + CSS）
│   ├── article.html         # 文章页（面包屑 + 上下篇导航）
│   └── series-index.html    # 系列索引页
├── _includes/nav.html       # 导航栏组件
├── _data/series.yml         # 系列元数据（控制文章列表页显示）
├── assets/css/main.css      # 全站样式
├── articles/                # 已发布文章
│   ├── {series}/index.md    # 系列索引（layout: series-index）
│   ├── {series}/{nn}-{slug}.md  # 系列文章（layout: article）
│   ├── lua-game/index.html  # 独立交互页（内联 CSS，无 Jekyll 布局）
│   └── lua-exam/index.html  # 独立交互页
├── study_notes/             # 源文档（Jekyll exclude，不发布）
├── ClaudeCode/              # 源文档（Jekyll exclude，不发布）
└── Docs/                    # 源文档（Jekyll exclude，不发布）
```

## 两种文章格式

### 1. 普通系列文章（.md，主要格式）

使用 Jekyll Liquid 布局，CSS 由 `assets/css/main.css` 提供：

```yaml
---
layout: article
title: "文章标题"
description: "简短描述"
level: intermediate        # beginner / intermediate / advanced
tags: ["标签1", "标签2"]
series: series-id          # 对应 _data/series.yml 中的 id
series_title: "系列名称"
order: 1
prev:
  title: "上一篇标题"
  url: "prev-slug.html"
next:
  title: "下一篇标题"
  url: "next-slug.html"
---
```

- 文件命名：`{nn}-{slug}.md`，编号从 `01` 开始
- 标题从 `##` 开始（`#` 由布局模板自动生成）
- 使用中文标点符号，代码块用三个反引号

### 2. 独立交互页（.html，仅用于游戏化/考试等特殊页面）

自包含 HTML 文件，内联所有 CSS 和 JS，无 Jekyll front matter。参考 `articles/lua-game/index.html`。

## 添加新系列

1. 在 `_data/series.yml` 末尾添加条目（包含 `id`, `title`, `description`, `order`）
2. 创建 `articles/{series-name}/index.md`，使用 `layout: series-index`
3. 在目录下创建文章 `.md` 文件

## 样式规范

所有样式集中在 `assets/css/main.css`，禁止在普通文章页面中内联 CSS。

- 主色调：`#2c3e50`，强调色：`#3498db`，背景：`#f5f5f5`
- 容器最大宽度：`900px`，文章内容：`800px`
- 标签级别：`.tag.beginner`（绿 `#27ae60`）/ `.tag.intermediate`（黄 `#f39c12`）/ `.tag.advanced`（红 `#e74c3c`）

## .claude/ 目录

```
.claude/
├── agents/          # 子代理定义（article-writer, content-reviewer, link-checker）
├── commands/        # 斜杠命令（/new-article, /new-series, /check-links, /deploy）
└── skills/          # 技能（git-workflow, html-article, seo）
```

使用 `/new-article` 创建新文章，`/new-series` 创建新系列，`/check-links` 检查链接。

## Git 规范

提交信息使用英文，动词开头。可选追加 Co-Authored-By：

```bash
git commit -m "Add article about X

Co-Authored-By: Claude <noreply@anthropic.com>"
```

类型前缀：`Add`（新增）/ `Update`（更新）/ `Fix`（修复）/ `Style`（样式）

不要提交 `Docs/`、`study_notes/`、`ClaudeCode/` 目录（这些是源文档，已在 `_config.yml` 中 exclude）。

## 常用命令

```bash
# 本地预览（需要 Ruby + Bundler）
bundle exec jekyll serve

# 仅构建
bundle exec jekyll build
```
