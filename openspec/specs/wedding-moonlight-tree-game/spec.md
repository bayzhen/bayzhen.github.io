# wedding-moonlight-tree-game Specification

## Purpose
为婚礼主页提供一套适合微信手机端的单屏月光花树互动体验，以明确的滑动与点击动作逐步呈现树木生长、花朵盛放、星光落下和完整邀请信息。
## Requirements
### Requirement: Guided moonlight tree journey
婚礼主页 SHALL 依次提供播种、树干生长、上滑展开树冠、点亮三处花苞、左右轻划摇树、点亮三颗落星和开启邀请函的引导流程。

#### Scenario: Visitor completes the full journey
- **WHEN** 访客按照当前阶段的提示完成对应动作
- **THEN** 页面依次推进到下一阶段
- **THEN** 完成三颗星后自动开启完整邀请函

#### Scenario: Visitor wants to skip the game
- **WHEN** 访客点击“直接查看邀请”
- **THEN** 页面直接显示完整邀请函

### Requirement: Rich botanical presentation
月光花树 SHALL 具有自然弯曲的枝干、前中后层树冠、形状与色彩有变化的叶片及花朵，并 SHALL 通过分层生长、微风摆动、月光和花瓣效果建立视觉层次。

#### Scenario: Tree reaches full bloom
- **WHEN** 访客完成树冠生长和三次花苞点击
- **THEN** 页面展示完整、有层次且不规则对称的花树
- **THEN** 树冠和花朵保持轻微但不妨碍阅读的环境动画

### Requirement: Simple forgiving gestures
上滑和左右轻划 SHALL 只判断清晰的主方向和合理距离，MUST NOT 要求精确路径、隐藏角度或限时操作；页面 SHALL 同时提供可点击的替代控件。

#### Scenario: Visitor grows the canopy with a swipe
- **WHEN** 访客在互动区域完成明显向上的滑动
- **THEN** 三层树冠依次展开

#### Scenario: Visitor shakes the tree
- **WHEN** 访客完成明显的横向轻划
- **THEN** 花树产生摇曳反馈并落下三颗可见星星

#### Scenario: Gesture is unavailable
- **WHEN** 访客使用键盘、辅助技术或选择点击提示控件
- **THEN** 页面能够触发与相应手势相同的阶段结果

### Requirement: Persistent visible interaction targets
当前需要操作的花苞或星星 SHALL 始终可见并具有足够大的触控区域，未完成的落星 MUST 保持在页面中直到被点亮。

#### Scenario: Visitor pauses during star collection
- **WHEN** 三颗星已经落下而访客暂时停止操作
- **THEN** 未点亮的星星保持可见且可继续点击
- **THEN** 页面不进入失败或自动重置状态

### Requirement: Reversible invitation state
完整邀请函 SHALL 展示已确认的新人、日期、典礼时间、酒店与邀请文字，并 SHALL 支持关闭返回花树、再次查看和重新体验完整流程。

#### Scenario: Visitor closes the invitation
- **WHEN** 访客点击关闭、返回花树、遮罩或按 Escape
- **THEN** 邀请函关闭并回到已经完成的花树场景

#### Scenario: Visitor restarts the journey
- **WHEN** 访客点击“重新体验”
- **THEN** 页面回到初始播种阶段
- **THEN** 已完成的树冠、花朵和星星状态被清除

### Requirement: Single-screen responsive behavior
互动流程与邀请函 SHALL 在常见手机及桌面视口内保持单屏呈现且不产生纵向页面滚动，并 SHALL 在减少动态效果偏好下提供快速、稳定的状态切换。

#### Scenario: Invitation is viewed on a narrow phone
- **WHEN** 视口为 320×568 或更大的常见手机尺寸
- **THEN** 当前操作提示、互动目标、页脚和邀请卡均位于视口内
- **THEN** 文档宽高不超过视口宽高

#### Scenario: Reduced motion is requested
- **WHEN** 系统启用减少动态效果偏好
- **THEN** 树木与粒子动画被缩短或停用
- **THEN** 所有阶段和内容仍可完整访问

### Requirement: Complete photographic story mapping
月光花树单页 SHALL 将现有九组婚纱照全部用于可见叙事：星光合照作为主背景，三组照片对应花苞记忆，四组照片对应三颗星的相框背面，黑色礼服合照作为最终邀请函背景。

#### Scenario: Visitor completes the normal journey
- **WHEN** 访客从播种开始完成三次花苞和三次落星互动
- **THEN** 九组婚纱照均在背景、记忆相框或最终邀请函中至少可见一次
- **THEN** 每组照片与相遇、相知、相守或最终邀请具有明确的叙事关系

### Requirement: Branch memory frame transitions
每次花苞互动 SHALL 展开对应照片并将其收拢为花树上的悬挂相框；每次落星互动 SHALL 翻转对应相框并展示其另一面照片，其中相知相框 SHALL 使用新娘和新郎肖像组成双联画面。

#### Scenario: Visitor blooms a memory
- **WHEN** 访客点击当前发光花苞
- **THEN** 对应记忆照片在当前单屏内展开并清晰可见
- **THEN** 展示结束后对应缩略相框保留在树上

#### Scenario: Visitor lights a fallen star
- **WHEN** 访客点击一颗未点亮的落星
- **THEN** 对应树上相框翻面并展示星光阶段照片
- **THEN** 已完成相框继续作为树景的一部分保留

### Requirement: Post-completion memory review
游戏完成并关闭邀请函后，树上的三组相框 SHALL 可被再次点击查看，且访客 SHALL 能在展开视图中查看相框的正反两面并关闭返回花树。

#### Scenario: Visitor revisits a frame
- **WHEN** 完成游戏的访客关闭邀请函并点击树上相框
- **THEN** 页面展开该相框当前一面的照片
- **THEN** 访客可以翻看另一面或关闭展开视图

### Requirement: Progressive responsive photo loading
页面 SHALL 在照片首次需要显示时才设置其加载来源，树上缩略相框 SHALL 使用小图，展开视图 SHALL 提供小图与高清图的响应式候选，并 MUST 保持已有照片内容、人物身份和构图不变。

#### Scenario: Visitor opens the initial page
- **WHEN** 花苞和落星互动尚未发生
- **THEN** 未显示的记忆相框照片不具有可请求的图片来源
- **THEN** 首屏继续优先加载当前主背景及必要页面资源

#### Scenario: Memory photo is expanded
- **WHEN** 某张记忆照片首次展开
- **THEN** 浏览器获得适合显示尺寸与像素密度的小图和高清图候选
- **THEN** 图片保持原始比例并避免人物面部被装饰层遮挡

### Requirement: Memory frames preserve the single-screen game
展开照片、悬挂相框和双联肖像 SHALL 保持在现有单页视口内，不得引入页面翻页或纵向滚动，并 SHALL 避免遮挡当前需要操作的花苞、星星、进度和邀请函入口。

#### Scenario: Memory is viewed on a narrow phone
- **WHEN** 访客在 320×568 或更大的常见手机视口中展开单张或双联照片
- **THEN** 照片、标题、关闭控件和必要操作均位于视口内
- **THEN** 文档尺寸不超过视口尺寸

