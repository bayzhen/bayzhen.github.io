---
layout: article
title: "角色系统"
description: "角色技能检查、继承与工厂模式、技能权重机制"
level: intermediate
tags: ["角色", "技能系统"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 6
prev:
  title: "动作系统"
  url: "05-action-system.html"
next:
  title: "上下文系统"
  url: "07-context-system.html"
---

## 1. 概述

角色系统负责管理游戏中每个英雄角色的特定逻辑，包括技能检查、技能使用决策、模型选择等。系统采用继承和工厂模式，支持25+个独特角色实现。

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      CharacterFactory                        │
│                   (ClassFactory<CharacterBase>)              │
└─────────────────────────────────┬───────────────────────────┘
                                  │ 创建
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       CharacterBase                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  virtual MatchType CheckQ(BaseContext*)             │   │
│  │  virtual MatchType CheckQDouble(BaseContext*)       │   │
│  │  virtual MatchType CheckC(BaseContext*)             │   │
│  │  virtual MatchType CheckCDouble(BaseContext*)       │   │
│  │  virtual MatchType CheckX(BaseContext*)             │   │
│  │  virtual bool SelectModel(BaseContext*)             │   │
│  │  virtual bool SelectSupply(BaseContext*)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────┘
                                  │ 继承
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐         ┌───────────────┐
│  Character A  │        │  Character B  │         │  Character C  │
├───────────────┤        ├───────────────┤         ├───────────────┤
│ CheckQ()      │        │ CheckQ()      │         │ CheckQ()      │
│ CheckC()      │        │ CheckC()      │         │ CheckC()      │
│ CheckX()      │        │ CheckX()      │         │ CheckX()      │
└───────────────┘        └───────────────┘         └───────────────┘
```

## 3. 技能类型枚举

```
enum SkillCheckType {
  None = 0,
  Q,          // Q技能
  QDouble,    // Q双击技能
  X,          // X终极技能
  C,          // C技能
  CDouble,    // C双击技能
};
```

## 4. CharacterBase 基类

```
class CharacterBase {
 public:
  CharacterBase() {};

  // 游戏模式相关检查
  virtual MatchType CheckGameModeSkill(BaseContext* ctx, const GameModeType& game_mode);
  virtual bool SelectSupply(BaseContext* ctx);
  virtual bool UpdateTarget(BaseContext* ctx);

  // 技能检查接口 - 子类重写实现角色特定逻辑
  virtual MatchType CheckX(BaseContext* ctx);
  virtual MatchType CheckQ(BaseContext* ctx);
  virtual MatchType CheckQDouble(BaseContext* ctx);
  virtual MatchType CheckC(BaseContext* ctx);
  virtual MatchType CheckCDouble(BaseContext* ctx);

  // 规则检查
  virtual MatchType CheckPreRule(BaseContext* ctx);
  virtual MatchType CheckPostRule(BaseContext* ctx);

  // 模型选择
  virtual bool SelectModel(BaseContext* ctx);

  // 通用技能使用辅助函数
  MatchType StandFocusUseSkill(BaseContext* ctx, Vector target, int min_hold = 0,
                               SkillType skill_type = SkillType::Q_SKILL);
  bool HasSetRightSkillTarget(BaseContext* ctx);

 protected:
  // 技能函数映射表
  const std::unordered_map<SkillCheckType, std::function<MatchType(CharacterBase*, BaseContext*)>> skillMap = {
      {SkillCheckType::Q, &CharacterBase::CheckQ},
      {SkillCheckType::QDouble, &CharacterBase::CheckQDouble},
      {SkillCheckType::C, &CharacterBase::CheckC},
      {SkillCheckType::X, &CharacterBase::CheckX},
      {SkillCheckType::CDouble, &CharacterBase::CheckCDouble},
  };

  // 获取游戏模式对应的技能检查数组
  virtual std::vector<SkillCheckType> GetGameModeSkillChecks(const GameModeType& game_mode);

  // 获取检查技能的权重，权重越大，越先检查
  virtual float GetSkillCheckWeight(const SkillCheckType& skill_check_type);
};
```

## 5. 技能检查流程

```
┌──────────────────────────────────────────────────────────────┐
│                    CheckGameModeSkill()                       │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              GetGameModeSkillChecks(game_mode)                │
│              返回: [Q, C, X, QDouble, CDouble]                │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│           按 GetSkillCheckWeight() 排序技能列表               │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  遍历技能列表                  │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │ CheckQ() │          │ CheckC() │          │ CheckX() │
  └────┬─────┘          └────┬─────┘          └────┬─────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ MatchType:: │       │ MatchType:: │       │ MatchType:: │
│ MATCH/NONE  │       │ MATCH/NONE  │       │ MATCH/NONE  │
└─────────────┘       └─────────────┘       └─────────────┘
```

## 6. 角色实现示例

```
class SupportCharacter : public CharacterBase {
 public:
  SupportCharacter() = default;

  // 重写Q技能检查
  MatchType CheckQ(BaseContext* ctx) override {
    // 检查Q技能CD
    if (!ctx->BotState().m_state.m_skillInfo.m_qSkill.m_isReady) {
      return MatchType::NONE;
    }

    // 检查是否有合适目标
    auto& enemies = ctx->getEnemies();
    if (enemies.empty()) {
      return MatchType::NONE;
    }

    // 获取预设的投掷点位
    auto& lineups = DATA_MANAGER()->GetCharacterQLineups(ctx->GetMapId());
    // ... 选择最优投掷点

    return MatchType::MATCH;
  }

  // 重写C技能检查
  MatchType CheckC(BaseContext* ctx) override {
    // C技能逻辑
    // ...
    return MatchType::NONE;
  }

  // 重写X终极技能检查
  MatchType CheckX(BaseContext* ctx) override {
    // 检查终极技能是否就绪
    if (!ctx->BotState().m_state.m_skillInfo.m_xSkill.m_isReady) {
      return MatchType::NONE;
    }

    // 检查使用条件
    // ...
    return MatchType::MATCH;
  }
};

// 工厂注册
REGISTER_CLASS(CharacterBase, SupportCharacter, "support");
```

## 7. 技能权重机制

```
// 不同角色可重写此方法返回不同权重
float CharacterBase::GetSkillCheckWeight(const SkillCheckType& skill_check_type) {
  // 默认权重
  switch (skill_check_type) {
    case SkillCheckType::X:
      return 100.0f;  // 终极技能优先级最高
    case SkillCheckType::Q:
      return 50.0f;
    case SkillCheckType::C:
      return 40.0f;
    case SkillCheckType::QDouble:
      return 30.0f;
    case SkillCheckType::CDouble:
      return 20.0f;
    default:
      return 0.0f;
  }
}

// CheckGameModeSkill 中的排序逻辑
std::vector<SkillCheckType> skills = GetGameModeSkillChecks(game_mode);

// 按权重降序排序
std::sort(skills.begin(), skills.end(), [this](auto& a, auto& b) {
  return GetSkillCheckWeight(a) > GetSkillCheckWeight(b);
});

// 依次检查
for (auto& skill : skills) {
  auto it = skillMap.find(skill);
  if (it != skillMap.end()) {
    MatchType result = it->second(this, ctx);
    if (result == MatchType::MATCH) {
      return result;
    }
  }
}
```

## 8. 通用投掷技能检查

```
MatchType CharacterBase::CheckUniversalThrowQSkill(
    BaseContext* ctx,
    int skill_id,
    float thresNearEnemyDist,
    float minusZ,
    int thresLastActiveCFrame) {

  // 1. 检查技能CD
  auto& skill = ctx->BotState().m_state.m_skillInfo.m_qSkill;
  if (!skill.m_isReady) return MatchType::NONE;

  // 2. 检查最近敌人距离
  auto& nearestEnemy = ctx->getNearestEnemy();
  if (nearestEnemy.first < thresNearEnemyDist) {
    return MatchType::NONE;  // 敌人太近，不使用投掷物
  }

  // 3. 检查上次使用间隔
  if (ctx->FrameNum() - ctx->GetKeepActiveQFrame() < thresLastActiveCFrame) {
    return MatchType::NONE;
  }

  // 4. 设置技能目标并返回匹配
  // ctx->GetAction()->SetSkillTarget(...)

  return MatchType::MATCH;
}
```

## 9. 与其他系统的交互

```
// 与规则系统交互
class RuleManager {
  // 调用角色的规则检查
  character->CheckPreRule(ctx);
  character->CheckPostRule(ctx);
};

// 与数据系统交互
auto& qLineups = DATA_MANAGER()->GetCharacterQLineups(mapId);
auto& xLineups = DATA_MANAGER()->GetCharacterXLineups(mapId);
auto& cLineups = DATA_MANAGER()->GetCharacterCLineups(mapId);

// 与上下文系统交互
const auto& state = ctx->BotState();
auto& enemies = ctx->getEnemies();
ctx->AppendAction(skillAction);
```

## 10. 扩展点：添加新角色

```
// 1. 创建角色头文件
class NewCharacter : public CharacterBase {
 public:
  NewCharacter() = default;

  MatchType CheckQ(BaseContext* ctx) override;
  MatchType CheckC(BaseContext* ctx) override;
  MatchType CheckX(BaseContext* ctx) override;

 private:
  // 角色特有成员
};

// 2. 实现角色逻辑
MatchType NewCharacter::CheckQ(BaseContext* ctx) {
  // 实现Q技能逻辑
  return MatchType::NONE;
}

// 3. 注册到工厂
REGISTER_CLASS(CharacterBase, NewCharacter, "new_character");

// 4. 添加技能配置数据（如需要）
```
