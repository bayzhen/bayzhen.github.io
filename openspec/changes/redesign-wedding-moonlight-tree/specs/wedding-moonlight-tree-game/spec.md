## Purpose

为婚礼主页提供一套适合微信手机端的单屏月光花树互动体验，以明确的滑动与点击动作逐步呈现树木生长、花朵盛放、星光落下和完整邀请信息。

## ADDED Requirements

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
