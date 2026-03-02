# 动作系统 (Action System)

## 1. 概述

动作系统负责将 AI 模型的输出（动作标签）转换为游戏可执行的具体动作。核心特点：

- **多任务学习架构**：一个模型产生多个预测头
- **Encode/Decode 双向转换**：状态 → 掩码，标签 → 动作
- **动作掩码约束**：确保只选择合法动作
- **工厂模式**：动态加载不同模式的动作类

## 2. ActionBase 基类

**文件位置**: `src/core/actions/action_base.h`

```cpp
class ActionBase {
  MAKE_NON_COPYABLE(ActionBase)

 public:
  ActionBase() = default;
  virtual ~ActionBase() = default;

  // 编码入口：将游戏状态转换为动作掩码
  void Encode(e::BaseContext* context, const std::vector<int>& legalActionShape,
              std::vector<std::vector<int>>& actionMasks) {
    ReshapeActionMasks(legalActionShape, actionMasks);
    EncodeActions(context, actionMasks);
  }

  // 解码入口：将模型输出标签转换为具体动作
  virtual void Decode(e::BaseContext* context, const std::vector<int>& labels) = 0;

 protected:
  // 子类实现的编码方法
  virtual void EncodeActions(e::BaseContext* context,
                             std::vector<std::vector<int>>& actionMasks) = 0;

  // 初始化掩码矩阵（全 1 表示全部合法）
  void ReshapeActionMasks(const std::vector<int>& legalActionShape,
                          std::vector<std::vector<int>>& actionMasks) {
    actionMasks.clear();
    actionMasks.resize(legalActionShape.size());
    for (size_t i = 0; i < legalActionShape.size(); ++i)
      actionMasks[i].resize(legalActionShape[i], 1);
  }
};
```

## 3. 动作类型体系 (11 个动作类)

| 类名 | 注册名 | 用途 | legal_action_shape |
|-----|-------|------|-------------------|
| `ActionBattle` | `battle_4v4` | 4v4 战斗 | [7, 43, 17, 17, 5] |
| `ActionNavigation` | `navigation` | 导航寻敌 | [5, 43, 17, 17] |
| `ActionAmbush` | `ambush` | 埋伏防守 | [7, 43, 17, 17] |
| `ActionHunting` | `hunting` | 狩猎追杀 | [17, 43, 17, 17, 3] |
| `ActionNewHunting` | `new_hunting` | 改进狩猎 | [14, 43, 17, 17] |
| `ActionNewNavigation` | `new_navigation` | 改进导航 | [7, 43, 17, 17] |
| `ActionThrowing` | `throwing` | 投掷物控制 | [4, 43, 17, 17] |
| `ActionChokePoint` | `battle_circle` | 卡点防守 | [9, 43, 17, 17] |
| `ActionTransfer` | `transfer` | 传送机动 | [7, 43, 17, 17] |
| `ActionJoking` | `joking` | 戏耍骚扰 | [5, 43, 17, 17] |
| `ActionSafeNav` | `safe_nav` | 安全导航 | [8, 43, 17, 17] |

## 4. SubTask 多维度动作空间

### 4.1 多任务学习架构

```
模型输出 (多头设计)
├─ TASK_MAIN (head 0)      → 主动作选择 (7-17 个动作)
├─ TASK_YAW (head 1)       → 水平旋转 (43 个量化值)
├─ TASK_PITCH (head 2)     → 垂直旋转 (17 个量化值)
├─ TASK_MOVE (head 3)      → 移动方向 (9 个方向: 0-7 + 静止)
└─ TASK_SKILL (head 4)     → 技能选择 (3-5 个技能)
```

### 4.2 ActionBattle 示例

```cpp
class ActionBattle final : public ActionBase {
  enum ActionType {
    ACTION_INVALID = 0,          // 无效
    ACTION_JUMP = 1,             // 跳跃
    ACTION_FIRE = 2,             // 开火
    ACTION_STOP_FIRE = 3,        // 停火
    ACTION_AIM = 4,              // 瞄准
    ACTION_UNAIM = 5,            // 取消瞄准
    ACTION_RESCUE = 6,           // 救援
    ACTION_HOLD_GRENADE = 7,     // 持有手雷
    ACTION_USE_GRENADE = 8,      // 使用手雷
    ACTION_SWITCH_WEAPON = 9,    // 切换武器
    ACTION_ACTIVE_SKILL = 10,    // 激活技能
    ACTION_USE_SKILL = 11,       // 使用技能
    ACTION_FLY = 12,             // 飘飞
    ACTION_STICK_WALL = 13,      // 贴墙
    ACTION_STOP_STICK_WALL = 14, // 取消贴墙
    ACTION_SWITCH_2D = 15,       // 侧身
    ACTION_STOP_SWITCH_2D = 16   // 取消侧身
  };

  enum SubTaskType {
    TASK_MAIN = 0,      // 主动作 (7 维)
    TASK_YAW = 1,       // 水平转向 (43 维)
    TASK_PITCH = 2,     // 垂直转向 (17 维)
    TASK_MOVE = 3,      // 移动 (17 维)
    TASK_SKILL = 4,     // 技能选择 (5 维)
  };
};
```

## 5. Encode 机制

### 5.1 编码流程

```
Encode(context, legalActionShape, actionMasks)
    │
    ├─ ReshapeActionMasks(legalActionShape)  // 初始化全 1
    │
    └─ EncodeActions(context, actionMasks)
        ├─ EncodeMainMask()      // TASK_MAIN: 主动作可行性
        ├─ EncodeYawMask()       // TASK_YAW: 水平转向范围
        ├─ EncodePitchMask()     // TASK_PITCH: 垂直转向限制
        ├─ EncodeMoveMask()      // TASK_MOVE: 移动方向约束
        └─ EncodeActiveSkillMask()  // TASK_SKILL: 技能可用性
```

### 5.2 主动作掩码编码

```cpp
bool ActionBattle::EncodeMainMask(BaseContext* ctx, std::vector<int>& mask) {
  const g::BotState& bs = ctx->BotState();

  // 爆破模式特殊处理
  if (ctx->CheckIsGameMode(GameModeType::GM_BOMB) &&
      bs.m_game.m_stage != g::GameStage::START) {
    mask.assign(mask.size(), 0);
    mask[ACTION_INVALID] = 1;
    return true;
  }

  mask[ACTION_INVALID] = 1;
  mask[ACTION_FIRE] = EncodeCanFire(ctx);
  mask[ACTION_STOP_FIRE] = EncodeStopFire(ctx);
  mask[ACTION_JUMP] = EncodeJump(ctx);

  mask[ACTION_FLY] = LogicUtils::EnableFly(bs) &&
                     bs.m_state.m_bodyState != g::BodyState::FIRST_JUMP &&
                     !ctx->IsKillingDying();

  mask[ACTION_STICK_WALL] = !bs.m_state.m_longTermState.m_isStickWall &&
                            !bs.m_state.m_longTermState.m_isSwitchingWeapon &&
                            !ctx->IsKillingDying();

  // 奥黛丽 Q 技能激活时的特殊限制
  if (bs.m_state.m_actorID == ACTORID::AODAILI &&
      bs.m_skill.m_info.m_activeId == ACTORSKILLID::AODAILI_Q) {
    mask.assign(mask.size(), 0);
    if (EncodeCanFire(ctx)) {
      mask[ACTION_FIRE] = 1;
    } else {
      mask[ACTION_INVALID] = 1;
    }
  }

  return true;
}
```

### 5.3 Pitch 角度编码

```cpp
bool ActionBattle::EncodePitchMask(BaseContext* ctx, std::vector<int>& mask) {
  const g::BotState& bs = ctx->BotState();
  int limit = 30;  // ±30 度限制
  bool canPitch = false;

  for (int label = 0; label < static_cast<int>(mask.size()); ++label) {
    float pitchDiff = label - 8;  // 中心点在 8
    float pitch = bs.m_camera.m_rotation.m_y + pitchDiff;
    LogicUtils::ClipAngle(pitch);

    if (std::abs(pitch) > limit) {
      mask[label] = 0;  // 超出范围设为非法
    } else {
      canPitch = true;
    }
  }

  // 如果无合法选择，强制选择最接近的合法值
  if (!canPitch) {
    float pitch = bs.m_camera.m_rotation.m_y;
    LogicUtils::ClipAngle(pitch);
    if (pitch < -limit)
      mask[16] = 1;  // 向下看
    else
      mask[0] = 1;   // 向上看
  }

  return true;
}
```

### 5.4 技能掩码编码

```cpp
bool ActionBattle::EncodeActiveSkillMask(BaseContext* ctx, std::vector<int>& mask) {
  const g::BotState& bs = ctx->BotState();
  mask.assign(mask.size(), 0);
  mask[0] = 1;  // 默认 "不激活技能"

  // 按英雄 ID 调用不同的编码函数
  if (bs.m_state.m_actorID == ACTORID::FEISHA)
    EncodeFeiShaSkill(ctx, mask);
  else if (bs.m_state.m_actorID == ACTORID::MING)
    EncodeMingSkill(ctx, mask);
  else if (bs.m_state.m_actorID == ACTORID::LAWEI)
    EncodeLaWeiSkill(ctx, mask);
  // ... 更多英雄

  // 冷却检查
  if (ctx->FrameNum() - ctx->GetLastQSkillFrame() < 10) {
    mask[1] = 0;  // Q 技能冷却
  }
  if (ctx->FrameNum() - ctx->GetLastXSkillFrame() < 50) {
    mask[2] = 0;  // X 技能冷却
  }

  // 检查是否有有效技能
  for (size_t i = 1; i < mask.size(); ++i) {
    if (mask[i]) {
      mask[0] = 0;  // 有可用技能则不选 "不激活"
      return true;
    }
  }
  return false;
}
```

## 6. Decode 机制

### 6.1 解码流程

```
Decode(context, labels)
    │
    │  labels = [TASK_MAIN, TASK_YAW, TASK_PITCH, TASK_MOVE, TASK_SKILL]
    │
    ├─ DecodeYawLabel(labels[TASK_YAW])
    ├─ DecodeMainLabel(labels[TASK_MAIN], labels[TASK_MOVE], labels[TASK_SKILL])
    ├─ DecodePitchLabel(labels[TASK_PITCH], labels[TASK_MAIN])
    └─ DecodeMoveLabel(labels[TASK_MOVE], labels[TASK_MAIN])
        │
        ▼
    ctx->AppendAction() 系列
        ├─ AppendAction(g::ActionType, src)
        ├─ ModelChangeFocus(yaw, pitch, src)
        ├─ AppendSwitch2DAction(flag, src)
        ├─ AppendStickWallAction(flag, src)
        └─ AppendSkillAction(skillType, flag, src)
```

### 6.2 Decode 实现

```cpp
void ActionBattle::Decode(BaseContext* ctx, const std::vector<int>& labels) {
  const g::BotState& bs = ctx->BotState();
  if (bs.m_state.m_aliveState == g::AliveState::DEAD) return;

  // 特殊状态检查
  if (LogicUtils::NeedStopInteracting(bs) || LogicUtils::IsInstallingBomb(bs)) {
    ctx->AppendInteractAction(false, LOG_SRC);
    return;
  }

  // 投掷物保护
  if (!ctx->ProtectThrowing()) {
    if (ctx->GetMatchPreRule().first != "throw_healing_grenade") {
      ctx->ModelChangeFocus(
        DecodeYawLabel(ctx, labels[TASK_YAW], labels[TASK_MAIN]),
        DecodePitchLabel(ctx, labels[TASK_PITCH], labels[TASK_MAIN]),
        LOG_SRC);
      DecodeMainLabel(ctx, labels[TASK_MAIN], labels[TASK_MOVE], labels[TASK_SKILL]);
    }
  }

  DecodeMoveLabel(ctx, labels[TASK_MOVE], labels[TASK_MAIN]);

  // 技能激活状态切回主武器
  if (!ctx->IsBattleModelStyle((int)ctx->GetLastModelStyle()) &&
      !bs.m_state.m_longTermState.m_isThrowing &&
      !ctx->MatchPreNoDecode() &&
      !LogicUtils::IsActiveWeapon(bs)) {
    ctx->SwitchToProperWeapon(LOG_SRC);
  }

  CheckRule(ctx, labels);
}
```

### 6.3 Yaw 解码（分段线性量化）

```cpp
float ActionBattle::DecodeYawLabel(BaseContext* ctx, const int label, const int mainLabel) {
  const g::BotState& bs = ctx->BotState();

  float yawDiff = label - 21;  // 中心点 21 对应 0 度差

  bool neg = (yawDiff < -0.1);
  yawDiff = std::abs(yawDiff);

  // 分段线性映射
  if (yawDiff > 17.)
    yawDiff = 41. + 5. * (yawDiff - 17.);      // 远端: 每级 5 度
  else if (yawDiff > 13.)
    yawDiff = 25. + 4. * (yawDiff - 13.);      // 中远端: 每级 4 度
  else if (yawDiff > 9.)
    yawDiff = 13. + 3. * (yawDiff - 9.);       // 中间: 每级 3 度
  else if (yawDiff > 5.)
    yawDiff = 5. + 2. * (yawDiff - 5);         // 近端: 每级 2 度

  if (neg) yawDiff = -yawDiff;

  // 爆破模式不转向
  if (ctx->CheckIsGameMode(GameModeType::GM_BOMB) &&
      bs.m_game.m_stage != g::GameStage::START)
    yawDiff = 0;

  return bs.m_camera.m_rotation.m_x + yawDiff;
}
```

### 6.4 Move 解码（8 方向 + 静止）

```cpp
void ActionBattle::DecodeMoveLabel(BaseContext* ctx, const int label, const int mainLabel) {
  const g::BotState& bs = ctx->BotState();

  // label=8 表示静止
  if (label == 8) {
    g::ActionPtr action = std::make_shared<g::Action>();
    action->m_action = g::ActionType::ACTION_MOVE;
    action->m_param.m_move.m_target = {0, 0, 0};
    ctx->AppendAction(action);
    return;
  }

  // label=0-7 对应 8 个方向（每 45 度一个）
  float angle = label * 45 + bs.m_camera.m_rotation.m_x;
  float arc = LogicUtils::Angle2arc(angle);

  g::ActionPtr action = std::make_shared<g::Action>();
  action->m_action = g::ActionType::ACTION_MOVE;
  action->m_param.m_move.m_target.m_x = std::cos(arc);
  action->m_param.m_move.m_target.m_y = std::sin(arc);
  action->m_param.m_move.m_target.m_z = 0;
  ctx->AppendAction(action);
}
```

## 7. 动作掩码 (ActionMasks)

### 7.1 掩码矩阵结构

```cpp
actionMasks: std::vector<std::vector<int>>
    │
    ├─ actionMasks[0] = mask for TASK_MAIN     // [1, 1, 1, 0, ..., 0]
    ├─ actionMasks[1] = mask for TASK_YAW      // [1, 1, 1, ..., 1]
    ├─ actionMasks[2] = mask for TASK_PITCH    // [0, ..., 1, 1, ..., 0]
    ├─ actionMasks[3] = mask for TASK_MOVE     // [1, 1, 0, ..., 0]
    └─ actionMasks[4] = mask for TASK_SKILL    // [1, 0, 0]
```

### 7.2 掩码应用

```cpp
// 在模型推理中
for (size_t j = 0; j < prob.size(); ++j) {
  if (mask[j] == 0) {
    prob[j] = 0;  // 非法动作概率置 0
  } else {
    prob[j] = std::exp(prob[j] - max_prob);
    sum += prob[j];
  }
}

// 选择最大概率的合法动作
int action_idx = 0;
float max_val = 0;
for (size_t j = 0; j < prob.size(); ++j) {
  if (prob[j] * mask[j] > max_val) {
    max_val = prob[j] * mask[j];
    action_idx = j;
  }
}
```

### 7.3 常见掩码规则

```cpp
// 交互中只能取消交互
if (bs.m_state.m_interactState.m_isInteracting && !isEnemyGrenadeNearby) {
  mask.assign(mask.size(), 0);
  mask[8] = 1;  // 只允许静止
}

// 贴墙期间不允许再贴墙
mask[ACTION_STICK_WALL] = !bs.m_state.m_longTermState.m_isStickWall &&
                          !bs.m_state.m_longTermState.m_isSwitchingWeapon;

// 防频繁切换：3 帧冷却
bool stickWallFreq = ctx->GetLastStickWallFrame() > 0 &&
                     ctx->FrameNum() - ctx->GetLastStickWallFrame() <= 3;
mask[ACTION_STICK_WALL] = !stickWallFreq;
```

### 7.4 移动掩码修改

```cpp
// 保持火力
void BaseContext::ChangeMoveMaskKeepFire(std::vector<int>& mask) {
  float yaw_to_enemy = AngleDiff(enemy.pos, bot.pos, bot.yaw);
  int enemy_dir = yaw_to_enemy / 45;
  int back_dir = (enemy_dir + 4) % 8;

  for (int i = 0; i < 8; ++i) {
    if ((i - back_dir + 8) % 8 < 2) {
      mask[i] = 0;  // 禁止背离敌人方向
    }
  }
}

// 防悬崖
void BaseContext::ChangeMoveMaskAwayCliff(std::vector<int>& mask) {
  const std::vector<float>& dists = GetCollisionTrace();

  for (int dir = 0; dir < 8; ++dir) {
    int idxb = dir * 3;
    int idxe = (dir + 1) * 3;

    bool cliff = dists[idxb] < DANGER_THRESHOLD &&
                 dists[idxe] < DANGER_THRESHOLD;
    if (cliff) mask[dir] = 0;
  }
}
```

## 8. 类工厂与动态创建

### 8.1 宏定义

```cpp
#define DECLARE_CREATE_FUNCTION(_interface, _class) \
  static _interface* CreateIntance() { return new _class; }

#define REGISTER_CLASS(_tag, _class, _interface) \
  static bool _class##Register = \
      common::clazz::ClassFactory<_interface>::GetInstance()->Insert( \
          _tag, &_class::CreateIntance)

#define CREATE_CLASS_INSTANCE(_tag, _interface) \
  common::clazz::ClassFactory<_interface>::GetInstance()->CreateClassInstance(_tag)
```

### 8.2 注册示例

```cpp
// action_battle.cc
REGISTER_CLASS("battle_4v4", ActionBattle, ActionBase);

// action_navigation.cc
REGISTER_CLASS("navigation", ActionNavigation, ActionBase);

// action_new_hunting.cc
REGISTER_CLASS("new_hunting", ActionNewHunting, ActionBase);
```

### 8.3 动态创建

```cpp
// 在 model_manager.cc 中
std::string action_name = model_descriptor_->ActionName();
ActionBase* action_translator = CREATE_CLASS_INSTANCE(action_name, ActionBase);
```

## 9. Action 数据结构

**文件位置**: `src/common/type/game/action.h`

```cpp
class Action {
 public:
  g::ActionType m_action;   // 动作类型枚举
  g::ActionParam m_param;   // 参数（union）
};

class ActionParam {
 public:
  FocusParam m_focus;               // yaw, pitch
  MoveParam m_move;                 // target vector
  RunParam m_run;                   // bool flag
  AimParam m_aim;                   // bool flag
  SwitchWeaponParam m_switchWeapon; // int slot
  Switch2DParam m_switch2D;         // bool flag
  StickWallParam m_stickWall;       // bool flag
  SkillParam m_skill;               // type, flag, useType
  // ... 20+ 参数类型
};

class ActionList {
 public:
  uint64_t m_id;
  unsigned int m_requestID;
  std::vector<ActionPtr> m_actions;
};
```

## 10. 扩展点

### 10.1 添加新动作类型

1. **创建动作类** `src/core/actions/action_new.h`:

```cpp
class ActionNew : public ActionBase {
  enum ActionType {
    ACTION_INVALID = 0,
    ACTION_CUSTOM_1 = 1,
    ACTION_CUSTOM_2 = 2,
  };

  enum SubTaskType {
    TASK_MAIN = 0,
    TASK_YAW = 1,
    TASK_PITCH = 2,
    TASK_MOVE = 3,
  };

 protected:
  void EncodeActions(BaseContext* ctx,
                     std::vector<std::vector<int>>& actionMasks) override {
    EncodeMainMask(ctx, actionMasks[TASK_MAIN]);
    EncodeYawMask(ctx, actionMasks[TASK_YAW]);
    EncodePitchMask(ctx, actionMasks[TASK_PITCH]);
    EncodeMoveMask(ctx, actionMasks[TASK_MOVE]);
  }

 public:
  void Decode(BaseContext* ctx, const std::vector<int>& labels) override {
    // 解码逻辑
  }

  DECLARE_CREATE_FUNCTION(ActionBase, ActionNew)
};
```

2. **注册动作类** `src/core/actions/action_new.cc`:

```cpp
REGISTER_CLASS("action_new", ActionNew, ActionBase);
```

3. **配置模型** `model.yaml`:

```yaml
action_name: "action_new"
legal_action_shape: [3, 43, 17, 17]
```
