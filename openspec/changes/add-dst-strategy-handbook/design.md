## Context

当前站点已经有多套文章系列，通常使用 `articles/<series-id>/index.md` 作为系列首页，单篇文章使用 `layout: article`，并通过 `_data/series.yml` 进入站点的系列发现入口。饥荒联机版策略手册会沿用这个结构，不引入新的布局或运行时依赖。

内容目标不是写成单篇长攻略，而是做成手册：玩家在游戏中或开局前可以快速查找某个问题的处理方案。由于 Don't Starve Together 仍会更新，所有数值型、版本敏感型建议必须在正式写作时核对当前资料。

## Goals / Non-Goals

**Goals:**

- 新建 `dst-strategy-handbook` 中文系列，覆盖从开局到后期循环的实战策略。
- 每篇文章都有清晰 front matter，参与现有系列导航。
- 文章结构统一，便于快速查找和后续维护。
- 在写作流程中加入来源核对，降低过期攻略的风险。
- 让系列首页承担目录、阅读路径和快速入口的职责。

**Non-Goals:**

- 不实现新的站内搜索、筛选器或 JavaScript 交互工具。
- 不在本 change 中建立自动爬取或自动更新游戏数据的管线。
- 不覆盖所有 MOD、极端挑战玩法或速通路线。
- 不承诺每个数值都永久正确；版本变化通过后续维护更新处理。

## Decisions

### D1: 用新系列而不是并入现有游戏攻略

Don't Starve Together 的机制密度足够高，且用户明确希望它是“手册一般的策略指南”。独立系列能提供稳定 URL、独立目录和明确维护边界。

Alternatives considered:

- 并入杂项文章：发现性差，后续章节增多后难以导航。
- 单篇长文：不适合快速查找，也不利于 patch 后局部更新。

### D2: 系列结构采用主题手册，而不是纯时间线流程

初版建议结构：

| Order | File | Topic |
| --- | --- | --- |
| 0 | `index.md` | 系列入口、快速查找、阅读路径 |
| 1 | `01-first-week.md` | 前 7 天生存与开局优先级 |
| 2 | `02-base-and-logistics.md` | 基地选址、核心建筑、资源动线 |
| 3 | `03-food-health-sanity.md` | 食物、生命、理智、保鲜与恢复 |
| 4 | `04-seasonal-planning.md` | 春夏秋冬准备与季节危机 |
| 5 | `05-characters-and-team-roles.md` | 角色定位、队伍分工、多人协作 |
| 6 | `06-combat-and-boss-prep.md` | 战斗基础、护甲武器、Boss 战前清单 |
| 7 | `07-caves-ruins-and-progression.md` | 洞穴、遗迹、远古科技与风险控制 |
| 8 | `08-farming-cooking-and-economy.md` | 农场、烹饪、资源循环与量产 |
| 9 | `09-crisis-playbook.md` | 死亡、团灭、基地烧毁、资源断档等应急 |
| 10 | `10-late-game-loop.md` | 后期目标、世界维护、重置与长期运营 |

这个顺序允许新手线性阅读，也允许老玩家从主题页跳入。

### D3: 每篇文章采用固定手册模板

单篇文章正文建议使用：

- `## 结论速查`
- `## 什么时候做`
- `## 优先级清单`
- `## 操作步骤`
- `## 常见错误`
- `## 相关条目`
- `## 版本与资料备注`

其中 `版本与资料备注` 用来记录“本文哪些内容依赖当前版本资料”。不是每篇都需要长引用，但凡涉及数值、掉落、制作要求、角色技能或近期机制，写作前必须查证。

### D4: 来源核对放在写作任务中完成

OpenSpec proposal 阶段只定义范围，不直接采集攻略细节。apply 阶段写文章时再查当前资料，优先核对官方更新公告、Klei 论坛/公告、官方 Wiki 或社区维护的权威资料。这样可以避免 proposal 阶段资料过期，也符合“文章内容以当前版本为准”的目标。

### D5: 不改布局，先用现有 Jekyll 能力

现有 `series-index` 和 `article` 布局已经足够承载该系列。初版只需要 Markdown、YAML 和链接约定。若后续发现快速查找需要专门 UI，再另开 change 处理搜索/索引组件。

## Risks / Trade-offs

- [Risk] 饥荒联机版版本更新导致攻略过期 -> Mitigation: patch-sensitive 内容写入独立表格或小节，并在文章中标明资料核对日期或依据。
- [Risk] 章节太多导致初版工作量膨胀 -> Mitigation: 先完成 10 篇核心手册文章，MOD、速通、极限玩法作为后续扩展。
- [Risk] 只写原则导致手册不可操作 -> Mitigation: 每篇必须有结论速查、优先级清单和操作步骤。
- [Risk] 只堆表格导致新手看不懂原因 -> Mitigation: 表格后保留简短解释，说明为什么这样做。

## Migration Plan

1. 新建 `articles/dst-strategy-handbook/`。
2. 添加系列首页和初版文章。
3. 在 `_data/series.yml` 注册 `dst-strategy-handbook`。
4. 本地构建或用 Jekyll 检查渲染结果。

Rollback: 删除新增系列目录并移除 `_data/series.yml` 中的系列项即可，不影响现有文章。

## Open Questions

- 是否需要在首版中加入“单人游玩 vs 多人队伍”的分叉路径？当前设计先在角色/队伍章节中覆盖。
- 是否需要做“按角色查攻略”的角色索引页？当前设计先保留为后续扩展，避免首版范围过大。
