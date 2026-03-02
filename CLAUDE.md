# 项目规范 - bayzhen.github.io

这是一个 GitHub Pages 个人技术博客网站，使用 Jekyll 构建。

## 技术栈

- Jekyll（GitHub Pages 原生支持）
- Markdown 文章 + Liquid 模板
- 共享 CSS（`assets/css/main.css`）
- GitHub Pages 自动构建部署

## 目录结构

```
/
├── _config.yml              # Jekyll 配置
├── _layouts/                # 页面布局模板
│   ├── default.html         # 基础布局（nav + CSS）
│   ├── page.html            # 通用页面
│   ├── article.html         # 文章页（面包屑 + 上下篇）
│   └── series-index.html    # 系列索引页
├── _includes/
│   └── nav.html             # 导航栏组件
├── _data/
│   └── series.yml           # 系列元数据
├── assets/css/
│   └── main.css             # 全站样式
├── index.html               # 首页
├── resume.html              # 简历页
├── articles/
│   ├── index.html           # 文章列表页（Liquid 自动生成）
│   ├── ai-inference-server/ # AI推理服务系列（13篇 .md）
│   ├── claude-code/         # Claude Code教程系列（9篇 .md）
│   ├── mbrl-study-notes/    # MBRL学习笔记系列（10篇 .md）
│   ├── zzz-guide/           # ZZZ英文笔记系列（10篇 .md）
│   ├── unreal-engine/       # 虚幻引擎系列（2篇 .md）
│   ├── lua-game/            # Lua 游戏化学习（独立交互页）
│   └── lua-exam/            # Lua 模拟考试（独立交互页）
└── Docs/                    # 源文档（不发布）
```

## 文章编写规范

### 新建文章
文章使用 Markdown 编写，头部包含 YAML front matter：

```yaml
---
layout: article
title: "文章标题"
description: "简短描述"
level: intermediate
tags: ["标签1", "标签2"]
series: series-id
series_title: "系列名称"
title_suffix: "系列名称"
order: 1
prev:
  title: "上一篇标题"
  url: "prev-slug.html"
next:
  title: "下一篇标题"
  url: "next-slug.html"
---
```

### 文件命名
- 系列索引：`articles/{series-name}/index.md`
- 文章：`articles/{series-name}/{nn}-{slug}.md`
- 编号从 `00` 或 `01` 开始

### 内容规范
- 使用中文标点符号
- 代码块使用 Markdown 围栏语法（三个反引号）
- 标题从 `##` 开始（`#` 由布局模板自动生成）
- 避免使用 emoji（除非用户明确要求）

## 样式规范

所有样式集中在 `assets/css/main.css`，不要在页面中内联 CSS。

- 主色调：`#2c3e50`（深蓝灰）
- 强调色：`#3498db`（蓝色）
- 背景色：`#f5f5f5`
- 卡片背景：`#fff`
- 最大宽度：`900px`（容器）/ `800px`（文章）
- 字体：系统字体栈

### 标签级别
- 入门：`.tag.beginner` - 绿色 `#27ae60`
- 进阶：`.tag.intermediate` - 黄色 `#f39c12`
- 高级：`.tag.advanced` - 红色 `#e74c3c`

## 添加新系列

1. 在 `_data/series.yml` 中添加系列条目
2. 创建 `articles/{series-name}/index.md`，使用 `layout: series-index`
3. 在目录下创建文章 `.md` 文件

## Git 规范

- 提交信息使用英文
- 格式：动词开头，简洁描述
- 示例：`Add new article about X`, `Fix broken links`, `Update navigation`

## 常用命令

```bash
# 本地预览（需要安装 Ruby + Bundler）
bundle exec jekyll serve

# 仅构建
bundle exec jekyll build
```
