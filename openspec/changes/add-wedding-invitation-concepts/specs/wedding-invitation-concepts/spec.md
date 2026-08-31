## Purpose

为新人提供多个可直接在浏览器和手机中比较的婚礼邀请函候选方案，并在正式照片、姓名与城市尚未补齐时保持完整、优雅且不泄露具体会场或联系方式的预览体验。

## ADDED Requirements

### Requirement: Candidate overview
系统 SHALL 在 `/wedding/` 提供候选方案入口，清楚展示三个视觉方向的名称、特征和独立访问入口。

#### Scenario: Compare all concepts
- **WHEN** 访客打开婚礼邀请函入口
- **THEN** 页面同时呈现现代电影感、法式纸张感和东方雅致三个候选方案
- **THEN** 每个方案均可通过明确链接进入完整预览

### Requirement: Shared invitation information
每个候选方案 SHALL 展示一致的婚礼基础信息，包括姓名占位、2026 年 10 月 6 日上午、城市占位、邀请文案、故事、当日流程和私下联系提示。

#### Scenario: Review content without final assets
- **WHEN** 正式姓名、城市和照片尚未提供
- **THEN** 页面使用清楚但不突兀的占位内容维持完整排版
- **THEN** 页面不得显示损坏图片或虚构具体会场信息

### Requirement: Distinct visual concepts
三个候选方案 MUST 在色彩、字体气质、版式、装饰语言和页面节奏上形成可感知的差异，同时保持相同的信息范围以便公平比较。

#### Scenario: Switch between concepts
- **WHEN** 访客依次打开三个候选方案
- **THEN** 访客可以辨认出电影感、法式编辑设计和东方婚礼美学三个不同方向
- **THEN** 每个页面提供返回候选入口的方式

### Requirement: Mobile-first presentation
候选入口和所有邀请函方案 SHALL 支持常见手机竖屏与桌面浏览，并在窄屏中保持文字可读、控件可点击且内容不发生水平溢出。

#### Scenario: Open from a mobile chat app
- **WHEN** 页面在宽度为 320 像素或更大的移动端视口中打开
- **THEN** 主要内容无需横向滚动即可阅读
- **THEN** 导航和候选链接具有足够的可点击区域

### Requirement: Privacy-preserving static page
候选页面 SHALL 仅包含允许公开的基础信息，不得包含手机号、酒店、具体会场地址、宾客名单或收集宾客数据的表单，并 SHALL 请求搜索引擎不索引这些页面。

#### Scenario: Inspect published invitation
- **WHEN** 候选页面随 GitHub Pages 公开发布
- **THEN** 页面只展示城市级地点占位和私下联系提示
- **THEN** 页面包含禁止索引的 robots 元数据

### Requirement: Accessible motion and navigation
页面 SHALL 提供语义化标题、键盘可访问链接和可见焦点，并在用户启用减少动态效果时停用非必要动画。

#### Scenario: Reduced-motion preference
- **WHEN** 浏览器报告 `prefers-reduced-motion: reduce`
- **THEN** 页面立即展示内容且不执行滚动进入动画

### Requirement: Self-contained static delivery
页面 SHALL 作为现有 Jekyll GitHub Pages 站点中的独立静态专题工作，不依赖服务端、构建时新增插件或第三方运行时资源。

#### Scenario: Build with the existing site
- **WHEN** 使用现有项目配置执行 Jekyll 构建
- **THEN** `/wedding/` 及三个候选路径均生成可访问的静态页面
- **THEN** 现有首页、导航和文章页面保持不变
