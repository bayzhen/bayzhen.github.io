## Why

现有 DST 手册已经覆盖了主要主题，但入口仍像“攻略文章目录”，不够像玩家游戏中需要的速查手册。实际使用场景更常见的是：“我现在第 N 天/某个季节，应该做什么、不该做什么？”以及“做饭、种地、角色技能这类系统怎么用？”

本 change 将手册重心调整为按天数和季节快速决策，并补充系统速查页。

## What Changes

- 修改系列首页，使第一屏优先回答“现在第几天/哪个季节该做什么”。
- 新增 `00-day-season-cheatsheet.md`，作为按天数、季节、危机信号组织的主速查表。
- 新增系统速查页：
  - `11-cooking-cheatsheet.md`：炊具锅、食材分类、常用料理选择。
  - `12-farming-cheatsheet.md`：种地、压力、营养、水分、杂草、农场什么时候值得做。
  - `13-character-cheatsheet.md`：角色选择、队伍职责、技能树/特殊系统的查询方法。
- 更新已有文章导航，让线性阅读从 `00` 速查页开始，后续主题页作为展开解释。
- 不新增站内搜索或交互组件；仍用 Markdown 表格和链接实现快速查找。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `dst-strategy-handbook`: 调整手册的 reader-visible 信息架构，从主题目录优先改为天数/季节速查优先，并加入系统细节速查入口。

## Impact

- 修改 `articles/dst-strategy-handbook/index.md`。
- 新增 `articles/dst-strategy-handbook/00-day-season-cheatsheet.md`。
- 新增 `articles/dst-strategy-handbook/11-cooking-cheatsheet.md`、`12-farming-cheatsheet.md`、`13-character-cheatsheet.md`。
- 更新相关文章的 previous/next 和交叉链接。
- 更新 OpenSpec spec 和 tasks。
