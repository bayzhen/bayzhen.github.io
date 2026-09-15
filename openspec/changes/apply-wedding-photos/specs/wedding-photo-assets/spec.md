## Purpose

让婚礼邀请函使用用户提供的真实婚纱照完成视觉预览，同时确保公开发布的图片不携带敏感拍摄元数据、加载体积适合移动端，并在不同页面比例中保持人物主体清晰可见。

## ADDED Requirements

### Requirement: Web-safe photo derivatives
系统 SHALL 仅发布从用户原图生成的网页副本，并 SHALL 从发布副本中移除 EXIF、定位、设备和时间等非图像元数据。

#### Scenario: Inspect a published photo
- **WHEN** 发布目录中的婚礼照片被检查
- **THEN** 文件不包含原始文件名或可识别拍摄位置、设备和时间的元数据
- **THEN** 原始 ZIP 和原始 JPEG 不存在于仓库中

### Requirement: Optimized mobile delivery
系统 SHALL 使用现代网页图片格式和适合现有源素材的最大尺寸，在不明显损害观感的前提下控制九张照片的总体积。

#### Scenario: Load invitation on mobile
- **WHEN** 访客从手机打开任一婚礼方案
- **THEN** 首屏只优先加载当前主视觉照片
- **THEN** 首屏以外的照片采用浏览器原生懒加载

### Requirement: Semantic and stable image presentation
所有可见婚礼照片 SHALL 使用语义化图片元素、有效替代文本和固有宽高属性，并 MUST 在现有容器中按方案指定焦点进行响应式裁切。

#### Scenario: Image loads normally
- **WHEN** 照片资源成功加载
- **THEN** 照片填满对应主视觉、故事或相册画框
- **THEN** 人物主体在桌面和手机布局中保持可见

#### Scenario: Image is unavailable
- **WHEN** 图片资源无法加载或辅助技术不呈现图片
- **THEN** 替代文本仍能描述该画面的主要内容

### Requirement: Style-specific photo selection
三个候选方案 SHALL 根据各自视觉语言使用不同的主视觉与相册组合，并 SHALL 使用同一组经过优化的共享照片资源。

#### Scenario: Compare concepts with real photos
- **WHEN** 用户从 `/wedding/` 依次打开三个候选方案
- **THEN** 电影感方案突出暗场星光婚纱照
- **THEN** 法式纸张感方案突出黑色礼服和暖色棚拍照片
- **THEN** 东方雅致方案突出明制婚服照片

### Requirement: Photographic overview previews
风格选择页 SHALL 在三个候选卡片中呈现对应方案的真实照片缩略预览，而不是继续显示纯占位构图。

#### Scenario: Open concept overview
- **WHEN** 用户打开 `/wedding/`
- **THEN** 每个候选卡片在保持原有文字可读性的同时展示其代表照片
