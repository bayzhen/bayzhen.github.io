# 项目规范 - bayzhen.github.io

这是一个 GitHub Pages 个人技术博客网站。

## 技术栈

- 纯静态 HTML + CSS（无构建工具）
- GitHub Pages 托管
- 中文内容为主

## 目录结构

```
/
├── index.html              # 首页
├── resume.html             # 简历页
├── articles/
│   ├── index.html          # 文章列表页
│   ├── ai-inference-server/  # AI推理服务系列（12篇）
│   ├── claude-code/          # Claude Code教程系列（9篇）
│   └── unreal-engine/        # 虚幻引擎系列
└── Docs/                   # 源文档（不发布）
```

## HTML 规范

### 页面结构
- `lang="zh-CN"` 中文页面
- 必须包含 `<nav>` 导航栏
- 使用 `.container` 包裹主内容
- 文章页使用 `.breadcrumb` 面包屑导航

### 样式规范
- 主色调：`#2c3e50`（深蓝灰）
- 强调色：`#3498db`（蓝色）
- 背景色：`#f5f5f5`
- 卡片背景：`#fff`
- 最大宽度：`900px`（容器）/ `800px`（文章）
- 字体：系统字体栈（-apple-system, BlinkMacSystemFont...）

### 导航栏
```html
<nav>
    <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/resume.html">简历</a></li>
        <li><a href="/articles/">文章</a></li>
    </ul>
</nav>
```

### 标签样式
- 入门：`.tag.beginner` - 绿色 `#27ae60`
- 进阶：`.tag.intermediate` - 黄色 `#f39c12`
- 高级：`.tag.advanced` - 红色 `#e74c3c`

## 文章命名规范

### 系列文章
- 索引页：`articles/{series-name}/index.html`
- 文章页：`articles/{series-name}/{nn}-{slug}.html`
- 编号从 `00` 或 `01` 开始

### 标题格式
- `<title>文章标题 - 陈栢成</title>`
- 文章内 `<h1>` 与 `<title>` 保持一致（不含后缀）

## 内容规范

- 使用中文标点符号
- 代码块使用 `<pre><code>` 包裹
- 代码高亮色：深色背景 `#2c3e50`，浅色文字 `#ecf0f1`
- 避免使用 emoji（除非用户明确要求）

## Git 规范

- 提交信息使用英文
- 格式：动词开头，简洁描述
- 示例：`Add new article about X`, `Fix broken links`, `Update navigation`

## 常用命令

```bash
# 本地预览（需要安装 live-server 或类似工具）
npx live-server --port=8080

# 检查链接
grep -r "href=" articles/ | grep -v "http"
```
