---
layout: article
title: "动作系统"
description: "多任务学习架构、Encode/Decode机制、动作掩码约束"
level: advanced
tags: ["动作空间", "多任务学习"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 5
prev:
  title: "规则系统"
  url: "04-rule-system.html"
next:
  title: "角色系统"
  url: "06-character-system.html"
---

## 1. 概述

动作系统负责将 AI 模型的输出（动作标签）转换为游戏可执行的具体动作。核心特点：

- **多任务学习架构**：一个模型产生多个预测头
- **Encode/Decode 双向转换**：状态 → 掩码，标签 → 动作
- **动作掩码约束**：确保只选择合法动作
- **工厂模式**：动态加载不同模式的动作类

## 2. 多任务学习架构

```
模型输出 (多头设计)
├─ TASK_MAIN (head 0)      → 主动作选择 (7-17 个动作)
├─ TASK_YAW (head 1)       → 水平旋转 (43 个量化值)
├─ TASK_PITCH (head 2)     → 垂直旋转 (17 个量化值)
├─ TASK_MOVE (head 3)      → 移动方向 (9 个方向: 0-7 + 静止)
└─ TASK_SKILL (head 4)     → 技能选择 (3-5 个技能)
```

## 3. ActionBase 基类

```
class ActionBase {
 public:
  // 编码入口：将游戏状态转换为动作掩码
  void Encode(BaseContext* context, const std::vector<int>& legalActionShape,
              std::vector<std::vector<int>>& actionMasks) {
    ReshapeActionMasks(legalActionShape, actionMasks);
    EncodeActions(context, actionMasks);
  }

  // 解码入口：将模型输出标签转换为具体动作
  virtual void Decode(BaseContext* context, const std::vector<int>& labels) = 0;

 protected:
  // 子类实现的编码方法
  virtual void EncodeActions(BaseContext* context,
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

## 4. ActionBattle 示例

```
class ActionBattle final : public ActionBase {
  enum ActionType {
    ACTION_INVALID = 0,          // 无效
    ACTION_JUMP = 1,             // 跳跃
    ACTION_FIRE = 2,             // 开火
    ACTION_STOP_FIRE = 3,        // 停火
    ACTION_AIM = 4,              // 瞄准
    ACTION_UNAIM = 5,            // 取消瞄准
    ACTION_RESCUE = 6,           // 救援
    ACTION_USE_GRENADE = 8,      // 使用手雷
    ACTION_SWITCH_WEAPON = 9,    // 切换武器
    ACTION_ACTIVE_SKILL = 10,    // 激活技能
    ACTION_FLY = 12,             // 飘飞
    ACTION_STICK_WALL = 13,      // 贴墙
    ACTION_SWITCH_2D = 15,       // 侧身
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

### 5.1 主动作掩码编码

```
bool ActionBattle::EncodeMainMask(BaseContext* ctx, std::vector<int>& mask) {
  const auto& bs = ctx->BotState();

  mask[ACTION_INVALID] = 1;
  mask[ACTION_FIRE] = EncodeCanFire(ctx);
  mask[ACTION_STOP_FIRE] = EncodeStopFire(ctx);
  mask[ACTION_JUMP] = EncodeJump(ctx);

  mask[ACTION_FLY] = LogicUtils::EnableFly(bs) &&
                     bs.m_state.m_bodyState != BodyState::FIRST_JUMP &&
                     !ctx->IsKillingDying();

  mask[ACTION_STICK_WALL] = !bs.m_state.m_longTermState.m_isStickWall &&
                            !bs.m_state.m_longTermState.m_isSwitchingWeapon &&
                            !ctx->IsKillingDying();

  return true;
}
```

### 5.2 Pitch 角度编码

```
bool ActionBattle::EncodePitchMask(BaseContext* ctx, std::vector<int>& mask) {
  const auto& bs = ctx->BotState();
  int limit = 30;  // ±30 度限制
  bool canPitch = false;

  for (int label = 0; label < mask.size(); ++label) {
    float pitchDiff = label - 8;  // 中心点在 8
    float pitch = bs.m_camera.m_rotation.m_y + pitchDiff;
    LogicUtils::ClipAngle(pitch);

    if (std::abs(pitch) > limit) {
      mask[label] = 0;  // 超出范围设为非法
    } else {
      canPitch = true;
    }
  }

  return true;
}
```

## 6. Decode 机制

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
        ├─ AppendAction(ActionType, src)
        ├─ ModelChangeFocus(yaw, pitch, src)
        ├─ AppendSwitch2DAction(flag, src)
        └─ AppendSkillAction(skillType, flag, src)
```

### 6.1 Yaw 解码（分段线性量化）

```
float ActionBattle::DecodeYawLabel(BaseContext* ctx, const int label, const int mainLabel) {
  const auto& bs = ctx->BotState();

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

  return bs.m_camera.m_rotation.m_x + yawDiff;
}
```

### 6.2 Move 解码（8 方向 + 静止）

```
void ActionBattle::DecodeMoveLabel(BaseContext* ctx, const int label, const int mainLabel) {
  const auto& bs = ctx->BotState();

  // label=8 表示静止
  if (label == 8) {
    auto action = std::make_shared<Action>();
    action->m_action = ActionType::ACTION_MOVE;
    action->m_param.m_move.m_target = {0, 0, 0};
    ctx->AppendAction(action);
    return;
  }

  // label=0-7 对应 8 个方向（每 45 度一个）
  float angle = label * 45 + bs.m_camera.m_rotation.m_x;
  float arc = LogicUtils::Angle2arc(angle);

  auto action = std::make_shared<Action>();
  action->m_action = ActionType::ACTION_MOVE;
  action->m_param.m_move.m_target.m_x = std::cos(arc);
  action->m_param.m_move.m_target.m_y = std::sin(arc);
  action->m_param.m_move.m_target.m_z = 0;
  ctx->AppendAction(action);
}
```

## 7. 动作掩码应用

```
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

## 8. 类工厂与动态创建

```
// 宏定义
#define DECLARE_CREATE_FUNCTION(_interface, _class) \
  static _interface* CreateIntance() { return new _class; }

#define REGISTER_CLASS(_tag, _class, _interface) \
  static bool _class##Register = \
      ClassFactory<_interface>::GetInstance()->Insert( \
          _tag, &_class::CreateIntance)

// 注册示例
REGISTER_CLASS("battle_4v4", ActionBattle, ActionBase);
REGISTER_CLASS("navigation", ActionNavigation, ActionBase);
REGISTER_CLASS("new_hunting", ActionNewHunting, ActionBase);

// 动态创建
std::string action_name = model_descriptor_->ActionName();
ActionBase* action_translator = CREATE_CLASS_INSTANCE(action_name, ActionBase);
```
