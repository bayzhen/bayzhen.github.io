# wedding-invitation-optimization Specification

## Purpose
让婚礼邀请函在保留人物真实身份和隐私边界的前提下，以更清晰、更协调且更适合移动设备的方式呈现照片，并提供不依赖公开联系方式的保存日期入口。
## Requirements
### Requirement: Identity-safe image enhancement
系统 SHALL 只发布不改变人物身份、五官、姿态、服装、道具和原始构图的照片增强版本，且 MUST 不以生成式清晰度换取可辨认的面部重建。

#### Scenario: Enhanced portrait is evaluated
- **WHEN** 增强版本与原图进行视觉对照
- **THEN** 人物五官和身份保持一致
- **THEN** 若生成式版本存在可辨认差异，系统改用非生成式保真锐化版本

### Requirement: Responsive high-quality photo delivery
所有婚礼照片 SHALL 提供至少一个较小屏幕版本和一个高质量完整版本，并 SHALL 通过浏览器响应式图片属性按实际显示宽度选择资源。

#### Scenario: Visitor opens a page on a phone
- **WHEN** 照片以较小 CSS 宽度显示
- **THEN** 浏览器可以选择较小的 WebP 资源
- **THEN** 页面不需要为每张照片固定下载最大版本

#### Scenario: Visitor opens a hero on a high-density screen
- **WHEN** 主视觉在高像素密度屏幕上显示
- **THEN** 浏览器可以选择足以覆盖其渲染尺寸的完整版本
- **THEN** 图片保持清晰且不出现明显压缩块

### Requirement: Theme-consistent photographic presentation
总览页和三个候选方案 SHALL 使用克制的对比度、饱和度和遮罩调整，让照片分别融入电影、纸张和东方主题，同时 MUST 保持人物面部清晰可见。

#### Scenario: Compare the three concepts
- **WHEN** 用户查看总览卡片和各方案主视觉
- **THEN** 电影方案呈现偏冷的深色质感
- **THEN** 纸张方案呈现柔和的暖纸质感
- **THEN** 东方方案保留自然肤色与朱砂红细节

#### Scenario: Editorial hero is viewed on a wide, short screen
- **WHEN** 纸张方案在超宽桌面视口中显示竖幅主视觉
- **THEN** 主视觉画框保持与源照片一致的 2:3 竖幅比例
- **THEN** 新郎、新娘和礼服完整保留，不因横向拉伸画框而发生严重纵向裁切

### Requirement: Non-obstructive mobile concept navigation
移动端方案切换导航 SHALL 在用户向下浏览内容时减少遮挡，并 SHALL 在回到页面顶部或向上滚动时恢复可见。

#### Scenario: Scroll down through a photo section
- **WHEN** 移动端用户持续向下滚动且已离开页面顶部
- **THEN** 固定导航移出可视区域

#### Scenario: Scroll upward or return to the top
- **WHEN** 用户向上滚动或回到页面顶部
- **THEN** 方案切换导航重新显示并可操作

### Requirement: Save-the-date download
每个完整邀请函方案 SHALL 提供同一个静态日历下载入口，且日历 MUST 只包含已经确认可公开的信息；准确时间和地点已确认时 SHALL 使用定时事件，否则 SHALL 保留不含推断信息的全天提醒。

#### Scenario: Download calendar entry before exact details exist
- **WHEN** 用户点击“保存日期”且准确时间和城市仍待补充
- **THEN** 下载项记录 2026 年 10 月 6 日全天并在描述中说明婚礼在上午
- **THEN** 日历文件不包含手机号、酒店或未确认地点

#### Scenario: Download calendar entry after details are confirmed
- **WHEN** 用户点击“保存日期”
- **THEN** 下载项记录陈栢成与任鹭的婚礼典礼及 2026 年 10 月 6 日 10:58 开始时间
- **THEN** 下载项地点为辽阳市龙和缘酒店
- **THEN** 日历文件不包含手机号、详细街道地址或未确认的结束时间

### Requirement: Safe incomplete invitation content
系统 SHALL 使用用户明确提供的信息替换对应占位内容，对仍未提供的字段 SHALL 保持明确占位，同时 MUST 不从照片、文件名或上下文推断未知信息。

#### Scenario: Publish optimized preview before final content
- **WHEN** 优化页面被构建且姓名、城市或准确时间仍未知
- **THEN** 未知姓名、城市和准确时间仍显示为现有占位内容
- **THEN** 页面不新增推断出的个人信息

#### Scenario: Publish formal invitation with confirmed details
- **WHEN** 正式信息版本被构建
- **THEN** 姓名、城市、酒店和典礼时间不再显示待补充占位
- **THEN** 页面不新增手机号、详细街道地址、未确认流程或其他推断出的个人信息

### Requirement: Consistent confirmed wedding details
总览页、三个完整邀请函方案和纸张方案分享卡片 SHALL 一致展示已确认的新人、典礼时间和酒店信息，且 MUST 不以旧占位文案覆盖已确认内容。

#### Scenario: Visitor reads any wedding page
- **WHEN** 用户打开总览页或任一完整邀请函方案
- **THEN** 页面展示新郎陈栢成与新娘任鹭
- **THEN** 页面将典礼时间展示为 2026 年 10 月 6 日 10:58
- **THEN** 页面将地点展示为辽阳市龙和缘酒店

#### Scenario: Recipient sees the editorial share card
- **WHEN** 社交平台读取纸张方案的分享元数据和封面
- **THEN** 分享标题或封面展示陈栢成与任鹭
- **THEN** 分享描述或封面展示 10 月 6 日 10:58 与辽阳市龙和缘酒店
