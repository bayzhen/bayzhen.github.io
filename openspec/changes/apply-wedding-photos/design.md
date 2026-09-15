## Context

现有 `/wedding/` 包含一个选择页和三个完整候选方案，每页已有主视觉、故事与相册照片容器。用户提供的 ZIP 包含九张 JPEG：七张竖幅、两张横幅，总体积约 1 MB，内容涵盖暗场白纱、欧式黑礼服、橙色棚拍和明制婚服。参见 `proposal.md` 和 `specs/wedding-photo-assets/spec.md`。

## Goals / Non-Goals

**Goals:**

- 让每种风格获得与其色彩和构图最匹配的真实主视觉。
- 共享单份优化图片，避免三个页面重复存储同一照片。
- 保持当前响应式布局、滚动动画和信息隐私边界。
- 使后续替换照片或最终删除未选方案保持简单。

**Non-Goals:**

- 不对人物五官、服装、背景或色彩进行生成式修改。
- 不从照片推断或填写姓名、城市、时间和故事文案。
- 不把原始 ZIP、微信原文件名或 JPEG 副本加入仓库。

## Decisions

### 使用去元数据的 WebP 共享资源

九张照片转换为高质量 WebP，最长边最多 1600 像素，并显式丢弃输入元数据。输出置于 `wedding/assets/photos/`，采用内容语义化英文名：

| 输出文件 | 原素材编号 | 内容 |
| --- | ---: | --- |
| `traditional-portrait.webp` | 34 | 明制婚服竖幅合影 |
| `veil-closeup.webp` | 35 | 头纱下横幅近景 |
| `starlight-couple.webp` | 36 | 暗场星光竖幅合影 |
| `black-gown-couple.webp` | 37 | 欧式墙面黑礼服合影 |
| `starlight-bride.webp` | 38 | 暗场新娘单人照 |
| `orange-portrait.webp` | 39 | 橙色背景正面合影 |
| `traditional-closeup.webp` | 40 | 明制婚服横幅近景 |
| `black-suit-groom.webp` | 41 | 黑色西装新郎单人照 |
| `orange-playful.webp` | 42 | 橙色背景互动合影 |

源图本身已经过微信压缩，直接再次输出 JPEG 会产生额外块状损失。WebP 在相近观感下更适合作为共享静态资源，且当前目标浏览器均支持。

### 保持完整画面文件，通过 CSS 调整焦点

不为每个容器生成永久裁切副本；所有页面引用同一组完整比例资源，并使用 `object-fit: cover` 与局部 `object-position` 控制构图。这样最终选择方案后仍可调整裁切而无需再次处理源文件。

### 按气质而非固定顺序分配照片

- 电影感：`starlight-couple` 作为主视觉，搭配 `veil-closeup`、`traditional-closeup`、`starlight-bride` 和 `black-suit-groom`。
- 法式纸张感：`black-gown-couple` 作为主视觉，搭配 `veil-closeup`、`orange-portrait` 和 `orange-playful`。
- 东方雅致：`traditional-portrait` 作为主视觉，搭配 `traditional-closeup`、`starlight-bride`、`veil-closeup` 和 `orange-playful`。

同一照片可以跨候选方案复用，因为用户当前比较的是照片与不同设计语言的组合，并非三个独立相册。

### 图片加载优先级

每页主视觉使用 eager loading 和高获取优先级，其余故事与相册图使用 `loading="lazy"` 和异步解码。所有图片写入实际输出宽高以减少布局偏移，替代文本描述画面而不猜测人物姓名。

## Risks / Trade-offs

- [固定画框会裁掉部分服装或背景] → 为每个容器设置独立焦点，并在手机与桌面截图中复核人物面部和主要动作。
- [原图分辨率和压缩程度不一致] → 不放大较小图片，只限制较大图片最长边并使用一致质量输出。
- [真实照片的强色彩可能改变原方案气质] → 允许各方案使用轻度 CSS 遮罩或混合效果，但不改动照片文件本身。
- [公开照片具有人物隐私风险] → 仅处理用户明确提供并要求应用的照片，同时移除可提取元数据。

## Migration Plan

1. 在临时目录解压并检查全部源图，不修改 ZIP。
2. 生成九张去元数据 WebP 并验证尺寸、格式和文件体积。
3. 更新选择页和三个方案的 HTML/CSS。
4. 完成 Jekyll 构建、资源路径检查和桌面/手机渲染复核。
5. 如需回滚，移除照片目录并恢复原占位元素与样式。
