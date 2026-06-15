# 球权系统分析 Manifest

> 生成时间：2026-05-27  
> 目的：梳理球权归属的完整框架与文件映射，作为持续深挖的导航索引

---

## 目录

1. [核心概念定义](#1-核心概念定义)
2. [底层管理层（写入侧）](#2-底层管理层写入侧)
3. [球权变更触发链](#3-球权变更触发链)
4. [球权查询接口（读取侧）](#4-球权查询接口读取侧)
5. [消费端：事件驱动模块](#5-消费端事件驱动模块)
6. [消费端：轮询模块](#6-消费端轮询模块)
7. [相关 JSON 配置参数](#7-相关-json-配置参数)
8. [待深挖专题](#8-待深挖专题)

---

## 1. 核心概念定义

| 概念 | 说明 | 字段位置 |
|---|---|---|
| **带球人 (Dribbler)** | 当前持球的具体球员，可能为空（球飞行中） | `black_box.dribbling_id` / `black_box.dribbler` |
| **球权队伍 (Ball Owner)** | 哪支队伍持有球权，可在无带球人时提前切换 | `black_box.ball_owner`（FakeTeam eid） |
| **ControlStage** | 当前控球状态阶段，影响球权判断触发条件 | `TakeBallManager.cur_stage` (C++) |
| **is_owning_ball** | C++ 侧 TeamLogicHelper 的球权标记（供 AI 线程读） | `TeamLogicHelper.is_owning_ball` |

### ControlStage 枚举（C++）

```
ControlStage::None        = 0  空阶段
ControlStage::Positioning = 1  传球前预跑位阶段（尚未出球）
ControlStage::Passing     = 2  传球中（球在飞行）
ControlStage::StrideBall  = 3  大步趟球阶段
ControlStage::NoDribbing  = 4  无人持球阶段（争抢中）
```

> ⚠️ 球权提前切换的触发条件：`NoDribbing` 或 `Passing` 阶段 + `dribbling_id == EID_EMPTY`

---

## 2. 底层管理层（写入侧）

### 2.1 TakeBallManager（C++，预测层）

| 项目 | 内容 |
|---|---|
| **文件** | `Engine/Sources/External/framecore/external/ai/take_ball_manager.h/.cpp` |
| **执行时机** | `late_tick_1`（主线程后置 tick） |
| **核心职责** | 预测哪方更快拿球，提前触发球权切换 |
| **核心方法** | `_update_ball_owner()` |
| **输出** | 调用 `black_box->py_change_ball_owner(team_index, eid, is_early=true)` |

**`_update_ball_owner()` 判断逻辑**：

```
触发条件：dribbling_id==EID_EMPTY && (NoDribbing || Passing)
         │
         ├── 只有一队有 taker
         │     └── 预计拿球帧距今 < SINGLE_SWITCH_BALL_TIME → 提前给球权
         │
         ├── 两队都有 taker
         │     ├── 帧差 > TIME_DIFF_THRESHOLD → 快的一方获得球权
         │     └── 帧差 ≤ 阈值 → 不切换（待定）
         │
         └── 候选人稳定 SWITCH_BALL_OWNER_STAY_FRAME 帧后才正式切换（防抖）
```

**关键成员变量**：

| 变量 | 类型 | 说明 |
|---|---|---|
| `cur_stage` | `ControlStage` | 当前控球阶段 |
| `takers[2]` | `int[2]` | 两队当前追球人 eid |
| `pre_takers[2]` | `int[2]` | 上一帧追球人 |
| `winner_and_loser[2]` | `int[2]` | 争球结果 |
| `last_judge_eid` | `int` | 上一帧判定候选人（防抖用） |
| `last_judge_frame` | `int` | 候选人首次被判定的帧号 |

---

### 2.2 BallOwnerManager（Python，官方登记层）

| 项目 | 内容 |
|---|---|
| **文件** | `Package/Script/Python/dm33/CommonLogic/FrameSync/Components/BallOwnerManager.py` |
| **挂载位置** | Mixin 到 `FootBallBlackBox` |
| **执行时机** | `late_tick_1`（`Ticker_BallOwnerManager`） |
| **核心字段** | `ball_owner`（FsProperty，持有球权的 FakeTeam.eid） |

**球权变更入口（两条路径）**：

```
路径 A：C++ 提前给球权
  TakeBallManager._update_ball_owner()
    └─→ black_box.py_change_ball_owner(team_index, eid, is_early=True)
          └─→ BallOwnerManager.cpp_change_ball_owner()
                └─→ change_ball_owner()

路径 B：正常换带球人（传球/射门/换带球人事件）
  事件监听：E_CHANGE_DRIBBLER / E_PASS / E_SHOOTING
    └─→ record_temp_dribbler_change()
          ├── 非 E_STATE_PLAY：直接 change_ball_owner()（定位球即时生效）
          └── E_STATE_PLAY：缓存到 dribbler_change_flag，下帧 late_tick_1 处理
```

**`change_ball_owner()` 做的事**：
1. 更新 `ball_owner` 字段
2. 使所有 FakeTeam 的 `_is_owning_ball` 缓存失效（置 `None`）
3. 若球权实际变化 → 触发 `E_CHANGE_BALL_OWNER` 事件
4. 同步 `last_change_ball_owner_time` 到 C++ 侧
5. 调用 `Presentation.OnBallOwnerChanged()`（表现层通知）

**`FsProperty` 关键字段**：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `ball_owner` | `0` | 当前球权队伍 eid |
| `override_ball_owner` | `None` | 强制覆盖球权（特殊场景） |
| `override_ball_owner_frame_id` | `-1` | 覆盖生效的帧号 |
| `change_ball_history` | `[0,0,0,0,0]` | 最近5次球权变更的帧号记录 |

---

### 2.3 C++ 侧同步字段

| 文件 | 字段 | 说明 |
|---|---|---|
| `black_box_logic_helper.h` | `is_owning_ball`（TeamLogicHelper 成员） | AI 线程读取用，Python 侧在 `TeamTaskTicker.py` 中同步 |
| `black_box_logic_helper.h` | `last_change_ball_owner_frame_id` | 最后一次球权变更帧号 |

**同步位置**：`TeamTaskTicker.py`

```python
self.cpp_black_box_logic_helper.is_owning_ball = self.IsOwningBall()
```

---

## 3. 球权变更触发链

```
[比赛事件]
    ├── E_CHANGE_DRIBBLER（换带球人）
    ├── E_PASS（传球出脚）
    ├── E_SHOOTING（射门出脚）
    ├── E_TOUCHBALL（触球，仅更新 last_touch_ball_team，不直接给球权）
    └── E_HITPLAYER（击打球员，同上）
           │
           ▼
  BallOwnerManager._on_event_ball_owner_manager()
           │
           ▼
  change_ball_owner(team, eid, is_early=False)
           │
  [或] TakeBallManager._update_ball_owner() → cpp_change_ball_owner(is_early=True)
           │
           ▼
  ball_owner 字段更新
  FakeTeam._is_owning_ball 缓存失效
           │
           ▼
  E_CHANGE_BALL_OWNER 事件广播
  + Presentation.OnBallOwnerChanged()
  + sync_last_change_ball_owner_time() 同步 C++
```

---

## 4. 球权查询接口（读取侧）

### 4.1 Python 侧

| 接口 | 文件 | 说明 |
|---|---|---|
| `team.IsOwningBall()` | `FakeTeam.py` line 537 | **主要查询入口**，带帧内缓存 |
| `player.IsOwningBall()` | `FakePlayer.py` line 824 | 转发到 `player.team.IsOwningBall()` |
| `black_box.get_is_owning_ball(team_eid)` | `BallOwnerManager.py` line 82 | 比较 `ball_owner == team_eid` |
| `black_box.ball_owner` | `BallOwnerManager.py` | 直接访问原始字段 |

**`IsOwningBall()` 缓存机制**：
- `_is_owning_ball` 为 `None` 时重新从底层取值
- `change_ball_owner()` 调用时置 `None` 使缓存失效
- 同一帧内多次调用有缓存，无性能问题

### 4.2 C++ 侧（AI 线程）

| 接口 | 文件 | 说明 |
|---|---|---|
| `team_logic_helper->get_is_owning_ball()` | `black_box_logic_helper.h` line 668 | AI 线程安全读取 |
| `black_box_helper->last_change_ball_owner_frame_id` | `black_box_logic_helper.h` line 559 | 查询上次球权变更帧 |

---

## 5. 消费端：事件驱动模块

订阅 `E_CHANGE_BALL_OWNER` 事件后响应的模块：

| 模块 | 文件 | 响应动作 |
|---|---|---|
| `AITeamForward` (C++) | `tasks/ai_team_forward.h/.cpp` | `change_ball_owner_callback` → 重置进攻阵型状态 |
| `AIDefenceFormation` (C++) | `tasks/ai_defence_formation.h/.cpp` | `CallBackOnChangeBallOwner` → `InitBackLineOnBallOwnerExchange` 重置后卫线 |
| `OffenceStayHRTask` (C++) | `tasks/offence_stay_hr_task.h/.cpp` | `change_ball_owner_callback` → 重置进攻留守 HR 逻辑 |
| `MateTargetInfluenceMap` (C++) | `influence_maps/mate_target_influence_map.h/.cpp` | `py_fill_mate_inf_on_ball_owner_changed` 重填影响力图 |
| `MateTargetInfluenceMap` (Py) | `InfluenceMap/MateTargetInfluenceMap.py` | `fill_mate_inf_on_ball_owner_changed` 重填 |
| `DynamicFakeGameCommander` | `DynamicFakeGameCommander.py` | `on_ai_ball_owner_changed` → 切换操控AI攻防状态 |
| `StreetFakeGameCmdAgent` | `StreetFakeGameCmdAgent.py` | `on_ai_ball_owner_changed` → 街球模式切换 |

---

## 6. 消费端：轮询模块

每帧直接调用 `IsOwningBall()` 判断攻防状态的模块：

### 6.1 跑位 / HomeRegion

| 模块 | 文件 | 用途 |
|---|---|---|
| `FixTeamHomeRegion` | `FixTeamHomeRegion.py` | 选 `OFF_LATTICE_INDEX` 还是 `DEF_LATTICE_INDEX` |
| `HomeRegion` | `Components/HomeRegion.py` | 计算无球跑位目标位置 |
| `SubHRTask` | `Task/SubTasks/SubHRTask.py` | `is_recently_change_ball_owner` 特殊修正 |
| `StreetHomeRegion` | `StreetHomeRegion.py` | 街球进攻/防守格子切换 |

### 6.2 TeamTask 触发条件

| 模块 | 文件 | 用途 |
|---|---|---|
| `RushOffenceFormation` | `Task/TeamTasks/RushOffenceFormation.py` | 仅有球权时激活 |
| `RushDefenceFormation` | `Task/TeamTasks/RushDefenceFormation.py` | 仅无球权时激活 |
| `LiyiAIDefenceTeamTask` | `Task/TeamTasks/LiyiAIDefenceTeamTask.py` | 无球权 + 其他条件触发 |
| `FlankPassTeamTask` | `Task/TeamTasks/FlankPassTeamTask.py` | 有球权时执行边路组织 |
| `OffsideCorrectionTask` | `Task/TeamTasks/OffsideCorrectionTask.py` | 球权状态影响越位修正 |

### 6.3 FakeGameCommander / 操控AI

| 模块 | 文件 | 用途 |
|---|---|---|
| `FakeGameCommanderAgent` | `FakeGameCommanderAgent.py` | 操控AI攻防模式切换条件 |
| `DynamicFakeGameCommander` | `DynamicFakeGameCommander.py` | 自动防守/进攻状态判断 |
| `DynamicGameCommander` | `Components/DynamicGameCommander.py` | 玩家操控时的攻防响应 |
| `GameCommander` | `Modules/GameCommander.py` | 传球/射门指令的球权门控 |

### 6.4 影响力图激活条件

| 影响力图 | 文件 | `is_active()` 逻辑 |
|---|---|---|
| `DribblerPushInfluenceMap` | `InfluenceMap/DribblerPushInfluenceMap.py` | 有球权时激活 |
| `InterceptInfluenceMap` | `InfluenceMap/InterceptInfluenceMap.py` | 无球权或 `should_chasing_ball` 时激活 |
| `NormalPassInfluenceMap` | `InfluenceMap/NormalPassInfluenceMap.py` | 有球权时激活 |
| `StraightPassInfluenceMap` | `InfluenceMap/StraightPassInfluenceMap.py` | 有球权时激活 |
| `MateTargetInfluenceMap` | `InfluenceMap/MateTargetInfluenceMap.py` | 有球权时激活 |
| `StreetDefenceRangeInfMap` | `InfluenceMap/StreetDefenceRangeInfMap.py` | 无球权时激活 |
| `StreetRunPosInfluenceMap` | `InfluenceMap/StreetRunPosInfluenceMap.py` | 无球权时激活 |
| `StreetInterceptInfMap` | `InfluenceMap/StreetInterceptInfMap.py` | 无球权时激活 |

### 6.5 其他重要消费者

| 模块 | 文件 | 用途 |
|---|---|---|
| `TeamTaskTicker` | `TeamTaskTicker.py` | 同步 `is_owning_ball` 到 C++ 侧 |
| `PlayerAnimation` | `Components/Anim/PlayerAnimation.py` | 传递给动画状态机 |
| `AIGuideAgent` | `AIGuideAgent.py` | AI 引导逻辑判断 |
| `Presentation.py` | `FrameSync/Presentation.py` | 表现层攻防 UI 切换 |
| `LogicStateMoveHelper` | `Components/LogicState/LogicStateMoveHelper.py` | 移动逻辑判断 |
| `SubHRTask` | `Task/SubTasks/SubHRTask.py` | `is_recently_change_ball_owner` 函数，判断最近是否刚换球权 |

---

## 7. 相关 JSON 配置参数

所有参数位于 `Package/JsonData/CommonData/AIParam.json`：

| 参数键 | 用途 | 所在逻辑 |
|---|---|---|
| `DOUBLE_SWITCH_BALL_TIME` | 双方都有追球人时，最快拿球帧距今的阈值（超过则不提前给） | `_update_ball_owner()` |
| `TIME_DIFF_THRESHOLD` | 双方追球人帧差阈值，超过则判定快方获胜 | `_update_ball_owner()` |
| `SINGLE_SWITCH_BALL_TIME` | 单方追球人距今帧数阈值（小于则提前给球权） | `_update_ball_owner()` |
| `SWITCH_BALL_OWNER_STAY_FRAME` | 候选人必须稳定多少帧才正式切换（防抖） | `_update_ball_owner()` |

---

## 8. 待深挖专题

以下是后续可以进一步展开的方向，按优先级排列：

### � 设计问题（已确认，待方案落地）

| 专题 | 详细文档 | 核心问题 |
|---|---|---|
| **Z. 无主球阶段 Task 层无感知** | `ball_possession_design_issues.md` | Rules 层指派了追球人，但 Task/HR 层不感知 NoDribbing，进攻方继续激进跑位。需引入"争夺态（CONTESTED）"第三态，驱动全队进入观望过 渡姿态 |

### �🔴 高优先级

| 专题 | 关键文件 | 核心问题 |
|---|---|---|
| **A. 提前给球权的时机改造** | `take_ball_manager.cpp` + `AIParam.json` | 现有"范围触发+防抖"改为"定点触发（距触球剩K帧）"，K 值支持按实力/场景动态调整，见 `ball_possession_design_issues.md` 优化方向2 |
| **B. 攻防状态切换延迟** | `BallOwnerManager.py` + `TeamTaskTicker.py` | `E_STATE_PLAY` 时缓存到下帧的策略是否带来切换延迟 |
| **C. HR 格子切换的响应速度** | `FixTeamHomeRegion.py` + `HomeRegion.py` | 球权变更后 HR 系统多久切换进攻/防守格子 |

### 🟡 中优先级

| 专题 | 关键文件 | 核心问题 |
|---|---|---|
| **D. 无球争夺期的球权归属** | `TakeBallManager.cpp` + `FreeBattleJudgeRule.h` | FreeBattle 场景下球权如何处理，与普通争抢的区别 |
| **E. 定位球的球权逻辑** | `BallOwnerManager.py` record_temp_dribbler_change | 非 E_STATE_PLAY 即时给球权 vs 正常延迟，对定位球阵型的影响 |
| **F. override_ball_owner 机制** | `BallOwnerManager.py` | 什么场景会触发强制覆盖，是否有逻辑漏洞 |

### 🟢 低优先级

| 专题 | 关键文件 | 核心问题 |
|---|---|---|
| **G. 影响力图激活时机** | 各 InfluenceMap 文件 | 球权切换后影响力图的激活/关闭是否与 Task 切换同步 |
| **H. change_ball_history 的使用** | `BallOwnerManager.py` | 最近5次球权历史用在哪里，是否有基于此的决策逻辑 |
| **I. is_recently_change_ball_owner** | `Task/SubTasks/SubHRTask.py` | 刚换球权的特殊修正逻辑对 HR 跑位的影响 |

---

---

## 9. 进攻 AI 框架速览（与球权系统的交界面）

> 详细文档：`Agent/knowledgebase/situation & role analyze/`

### 现有进攻 AI 框架（当前实现）

```
TacticTaskManager
  └── 基于球场区域（Zone）的静态状态机
        持球人进入哪个 Zone → 激活该 Zone 对应的唯一 Situation

当前活跃 Situation（4个）：
  PossessionSituationA    Zone A 后场控球（反击评分低时触发）
  OverlapSituationB       Zone B 中场推进/套边（无进入评分，直接触发）
  GenericCrossSituationD  Zone D 边路传中（无进入评分，直接触发）
  GenericFinishSituationE Zone E 禁区终结（无进入评分，直接触发）
```

### Situation 的退出条件结构（与球权直接相关）

**关键共性**：所有 Situation 的 `check_exit_condition()` 首行判断都是：

```cpp
if (dribbler == nullptr) return false;  // 无持球人 → 不退出
```

**影响**：CONTESTED 阶段（无持球人）时，**所有 Situation 都不会退出**。  
球权系统引入 CONTESTED 第三态后，需要额外处理"无持球人时强制挂起 Situation"的逻辑，否则 Situation 的 Role 分配会继续运行（HR 跑位目标继续有效），与观望态设计冲突。

| Situation | 退出主要条件 | 无持球人时行为 |
|---|---|---|
| `PossessionSituationA` | 球向前推进速度 > ExitBallSpeed | 不退出，维持控球跑位 |
| `OverlapSituationB` | 持球人离开 B 区 + Runner3 已前插到位 | 不退出，维持套边跑位 |
| `GenericCrossSituationD` | 持球人和球都离开 D 区 | 不退出，维持传中包抄跑位 |
| `GenericFinishSituationE` | 持续 ExitTime + 持球人和球都离开 E 区 | 不退出，维持禁区抢点跑位 |

### 与球权系统的交界面分析

```
当前耦合点：
  1. TacticTaskManager 每帧检查 dribbler 是否存在
     → dribbler == nullptr 时 Situation 不退出（维持但不推进）
     → CONTESTED 阶段会导致 Situation 僵持在最后状态

  2. TacticTaskManager 检查 IsOwningBall()
     → IsOwningBall() = False 时，不激活任何 Situation
     → CONTESTED 下若两队 IsOwningBall() 均返回 False
       → 双方 Situation 全部不激活（正确行为）

  3. Role 的跑位目标每帧根据 Situation 分配结果重新计算
     → CONTESTED 时若 Situation 僵持，Role 仍给出跑位目标
     → HR 跑位仍在按攻/守格子运行（这就是问题所在）
```

### 现有实现问题总结（参考 `02_Analysis_Summary.md`）

- Zone E 6 个细分 Role（Finisher/Shooter/支撑位）全部废弃，退化为 2 个通用 Attacker
- 1 对 1 Zone-Situation 映射，无 Bidding 竞争，战术单一
- Situation 进入条件大多 `return true`，无动态评分
- Role 分配每帧独立计算，无人选连贯性（跨 Situation 切换时球员角色任意跳变）

---

## 附：路径前缀说明

| 缩写 | 完整路径 |
|---|---|
| `<CPP>` | `Engine/Sources/External/framecore/external/ai/` |
| `<PY>` | `Package/Script/Python/dm33/CommonLogic/FrameSync/Components/AI/` |
| `<PY_ROOT>` | `Package/Script/Python/dm33/CommonLogic/FrameSync/` |
| `<JSON>` | `Package/JsonData/CommonData/` |

---

## 10. 迭代记录

### v0.1 — 2026-05-27 初版分析

**内容**：完成球权系统全链路梳理，建立 manifest 骨架。
- 确认两条球权变更路径（事件驱动 / C++ 预测提前给）
- 梳理 12 个 Case 的完整事件流
- 发现 Task/HR 层在无主球阶段行为不一致的核心设计问题
- 输出初版 CONTESTED 第三态设计方案（入口条件：`NoDribbing`）
- 识别 7 个风险点，其中🔴高优先级 2 个

---

### v0.2 — 2026-05-28 根因修订：引入 UNOWNED 第一类原语

**触发原因**：  
v0.1 的 CONTESTED 入口条件依赖 `ControlStage::NoDribbing`，被指出这是行为层（behavioral layer）的枚举，与球权层（ownership layer）不在同一抽象层次。根因在于"无主球"这个概念从来没有在球权层被显式定义为**第一类原语**。系统一直用行为层信号拼凑球权状态，导致 `ControlStage` 的语义穿透到 Task/HR 等消费层。

**核心变更**：

1. **引入 `UNOWNED` 第一类原语**  
   球权层不再是二元（A队 / B队），正式引入第三态：
   ```
   OWNED_BY(team)  —— 有持球人或预测明确归属某队
   UNOWNED         —— 球不属于任何队（第一类概念，不由行为状态推断）
   ```

2. **CONTESTED 条件重新定义（不依赖 ControlStage）**  
   ```python
   # 旧定义（废弃）：依赖 ControlStage::NoDribbing
   is_contested = (stage == NoDribbing) AND NOT has_clear_winner()
   
   # 新定义（权威）：纯球权层原语
   is_unowned = (dribbling_id == EID_EMPTY) AND NOT has_clear_winner()
   ```
   `ControlStage` 完全封装在 `TakeBallManager` 内部，不暴露到球权层及以上。

3. **建立三层分层模型**  
   ```
   球权层（Ball Ownership Layer）
     └── 暴露 ball_possession_state 三态枚举
           └── 内部调用 TakeBallManager.has_clear_winner()
   预测层（TakeBallManager）
     └── has_clear_winner() 封装 ControlStage / takers / 帧差
   消费层（Task / HR / InfluenceMap）
     └── 只读 ball_possession_state，零感知 ControlStage
   ```

**解决的问题**：
- 🔴 风险1（Passing 阶段拦截不触发 CONTESTED）：新定义下 Passing 阶段帧差≤阈值时同样进入 UNOWNED，风险消除
- 🟡 风险5（头球争顶 take_frame 误差）：同上，Passing 阶段现在也可进入 UNOWNED

**遗留待处理**：
- 风险2（K 值单一性）需重新评估——入口精准后实际影响有所降低，仍需测试验证
- 风险3/4/6/7 不受本次修订影响，状态不变

**预期效果**：
- 实现后 Task/HR/InfluenceMap 代码中 `ControlStage` 零引用
- `ball_possession_state` 三态可在 QuickGUI/Log 中直观观测
- 无主球阶段球员行为收敛，不再出现"进攻球员持续前插直到对方实际触球"的表现

**验收标准**：
1. 搜索 Task / HR / InfluenceMap 层，`ControlStage` 零命中
2. Case 2（Passing 阶段拦截）能正确进入 UNOWNED 观望态
3. Case 3 / 5 / 7 的非追球人 HR 格子在 UNOWNED 期间不切换
4. UNOWNED 状态在调试工具中可见
