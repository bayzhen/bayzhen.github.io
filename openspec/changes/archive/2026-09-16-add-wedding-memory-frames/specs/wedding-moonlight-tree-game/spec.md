## ADDED Requirements

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
