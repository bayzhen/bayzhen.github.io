## MODIFIED Requirements

### Requirement: Progressive responsive photo loading
页面 SHALL 在初始解析阶段提前请求全部展示用小图，并 SHALL 在首屏可用后按叙事优先级、有限并发地后台预热全部高清图；展开视图 SHALL 继续提供小图与高清图的响应式候选，并 MUST 保持已有照片内容、人物身份和构图不变。预加载失败 MUST NOT 阻塞游戏或邀请函，访客触发展示时 SHALL 仍可通过原图片地址完成加载。

#### Scenario: Visitor opens the initial page
- **WHEN** 花苞和落星互动尚未发生
- **THEN** 浏览器已经能够发现并请求九组照片的展示用小图
- **THEN** 当前主背景、页面样式和脚本仍保持首屏优先级

#### Scenario: Initial page becomes available
- **WHEN** 首屏必要资源完成且浏览器获得后台执行机会
- **THEN** 页面按正常叙事出现顺序开始预热高清照片
- **THEN** 高清预热限制并发且不要求访客先点击花苞或星星

#### Scenario: Memory photo is expanded
- **WHEN** 某张记忆照片首次展开
- **THEN** 浏览器优先复用已经预热的图片缓存，并仍获得适合显示尺寸与像素密度的小图和高清图候选
- **THEN** 图片保持原始比例并避免人物面部被装饰层遮挡

#### Scenario: A preload request fails
- **WHEN** 弱网或临时网络错误导致某张照片预热失败
- **THEN** 游戏初始化和阶段推进不被阻塞
- **THEN** 访客触发该照片时浏览器仍使用正常图片来源重新请求
