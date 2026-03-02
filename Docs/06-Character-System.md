# 角色系统设计文档

## 概述

角色系统负责管理游戏中每个英雄角色的特定逻辑，包括技能检查、技能使用决策、模型选择等。系统采用继承和工厂模式，支持25+个独特角色实现。

## 架构图

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
│  │  virtual MatchType CheckPreRule(BaseContext*)       │   │
│  │  virtual MatchType CheckPostRule(BaseContext*)      │   │
│  │  virtual bool SelectModel(BaseContext*)             │   │
│  │  virtual bool SelectSupply(BaseContext*)            │   │
│  │  virtual bool UpdateTarget(BaseContext*)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────┘
                                  │ 继承
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐         ┌───────────────┐
│    Aodaili    │        │   Mixueer     │         │   Xinchang    │
│  (奥黛丽)      │        │  (米雪儿)      │         │   (心昌)      │
├───────────────┤        ├───────────────┤         ├───────────────┤
│ CheckQ()      │        │ CheckQ()      │         │ CheckQ()      │
│ CheckC()      │        │ CheckC()      │         │ CheckC()      │
│ CheckX()      │        │ CheckX()      │         │ CheckX()      │
│ ...           │        │ ...           │         │ ...           │
└───────────────┘        └───────────────┘         └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
                        ┌───────────────────┐
                        │   更多角色实现...   │
                        │ Lawei, Galatia,   │
                        │ Madeleina, etc.   │
                        └───────────────────┘
```

## 核心类设计

### SkillCheckType 枚举

```cpp
// src/core/characters/character_base.h:14-21
enum SkillCheckType {
  None = 0,
  Q,          // Q技能
  QDouble,    // Q双击技能
  X,          // X终极技能
  C,          // C技能
  CDouble,    // C双击技能
};
```

### CharacterBase 基类

```cpp
// src/core/characters/character_base.h:23-84
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
  MatchType StandFocusUseSkill(BaseContext* ctx, g::Vector target, int min_hold = 0,
                               g::SkillType skill_type = g::SkillType::Q_SKILL);
  MatchType StandFocusHandleSkill(BaseContext* ctx, g::Vector target);
  void MoveToEnd(BaseContext* ctx);
  bool HasSetRightSkillTarget(BaseContext* ctx);

  // 位置检查
  bool CheckPosIllegal(BaseContext* ctx, g::Vector pos);
  bool CheckInBattle(const g::BotState& state);
  bool CheckInBattle(BaseContext* ctx);

  // 模式目标相关
  g::Vector GetModeTarget(BaseContext* ctx);
  int EnemyNearModeTarget(BaseContext* ctx, float thre);
  int AllyNumNearModeTarget(BaseContext* ctx, float thre);

  // 技能使用决策
  MatchType UseSkillForModeTarget(BaseContext* ctx, int slot, bool active_cond);
  MatchType UseSkillForHisEnemy(BaseContext* ctx, int slot, bool consider_enemies = true);
  void StandUseSkill(BaseContext* ctx);

  // 通用投掷技能检查
  MatchType CheckUniversalThrowCSkill(BaseContext* ctx, int skill_id, ...);
  MatchType CheckUniversalThrowQSkill(BaseContext* ctx, int skill_id, ...);

  // 通用治疗/掩护技能
  MatchType CheckCommonHealingCSkill(BaseContext* ctx);
  MatchType CheckCommonShelterCSkill(BaseContext* ctx);

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

  void GetProtectTarget(BaseContext* ctx, g::Vector& protect_target, bool attacker, float dist_threshold);
};
```

## 技能检查机制

### 技能检查流程

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

### MatchType 返回值

```cpp
enum class MatchType {
  NONE = 0,     // 不匹配，继续检查下一个
  MATCH = 1,    // 匹配成功，执行该技能
  SKIP = 2,     // 跳过后续检查
};
```

## 角色实现列表

| 角色名 | 类名 | 头文件 | 说明 |
|-------|------|--------|------|
| 奥黛丽 | Aodaili | aodaili.h | 支援型角色 |
| 米雪儿 | Mixueer | mixueer.h | 投掷物专家 |
| 心昌 | Xinchang | xinchang.h | 控制型角色 |
| 拉薇 | Lawei | lawei.h | 烟雾/闪光专家 |
| 加拉提亚 | Galatia | galatia.h | 雪球投掷 |
| 马德莱娜 | Madeleina | madeleina.h | 防御型角色 |
| 梅瑞迪斯 | Meiruidisi | meiruidisi.h | 战术型角色 |
| 零一 | Lingyi | lingyi.h | 机动型角色 |
| 蕾欧娜 | Leiouna | leiouna.h | 立方体技能 |
| 伊薇特 | Yiweite | yiweite.h | Q技能专精 |
| 白墨 | Baimo | baimo.h | - |
| 芙拉薇雅 | Fulaweiya | fulaweiya.h | - |
| 法格兰丝 | Fagelansi | fagelansi.h | - |
| 星辉 | Xinghui | xinghui.h | - |
| 玛拉 | Mala | mala.h | - |
| 明 | Ming | ming.h | - |
| 菲莎 | Feisha | feisha.h | - |
| 千黛 | Qiandai | qiandai.h | - |
| 香奈美 | Xiangnaimei | xiangnaimei.h | - |
| 艾卡 | Aika | aika.h | - |
| 汐 | Xi | xi.h | - |
| 幽雾 | Youwu | youwu.h | - |
| 知慕心夏 | Zhimuxinxia | zhimuxinxia.h | - |
| Alpha僵尸 | AlphaZombie | alpha_zombie.h | 僵尸模式 |
| Lilith僵尸 | LilithZombie | lilith_zombie.h | 僵尸模式 |

## 角色实现示例

### 典型角色实现

```cpp
// src/core/characters/mixueer.h (示例)
class Mixueer : public CharacterBase {
 public:
  Mixueer() = default;

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
    auto& lineups = DATA_MANAGER()->GetMiXueErQLineups(ctx->GetMapId());
    // ... 选择最优投掷点

    return MatchType::MATCH;
  }

  // 重写C技能检查
  MatchType CheckC(BaseContext* ctx) override {
    // 米雪儿C技能逻辑
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
REGISTER_CLASS(CharacterBase, Mixueer, "mixueer");
```

### 投掷物角色技能实现

```cpp
// 通用投掷Q技能检查
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

## 技能权重机制

### 权重配置

```cpp
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
```

### 权重排序

```cpp
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

## 工厂模式

### 角色工厂

```cpp
// 使用 ClassFactory 模板创建角色
using CharacterFactory = ClassFactory<CharacterBase>;

// 注册角色
REGISTER_CLASS(CharacterBase, Aodaili, "aodaili");
REGISTER_CLASS(CharacterBase, Mixueer, "mixueer");
REGISTER_CLASS(CharacterBase, Xinchang, "xinchang");
// ... 更多角色

// 创建角色实例
CharacterBase* character = CharacterFactory::Create("mixueer");
```

### 角色选择

```cpp
// 在 PredictExecutor 中根据 actorId 选择角色
CharacterBase* SelectCharacter(int actorId) {
  std::string characterName = GetCharacterNameById(actorId);
  return CharacterFactory::Create(characterName);
}
```

## 与其他系统的交互

### 与规则系统交互

```
┌─────────────────┐        ┌─────────────────┐
│  RuleManager    │◄──────►│ CharacterBase   │
├─────────────────┤        ├─────────────────┤
│ Pre-rules       │        │ CheckPreRule()  │
│ Post-rules      │        │ CheckPostRule() │
└─────────────────┘        └─────────────────┘
```

角色可以通过 `CheckPreRule()` 和 `CheckPostRule()` 方法添加角色特定的规则逻辑。

### 与数据系统交互

```cpp
// 获取角色特定的技能配置点
auto& qLineups = DATA_MANAGER()->GetMiXueErQLineups(mapId);
auto& xLineups = DATA_MANAGER()->GetMiXueErXLineups(mapId);
auto& cLineups = DATA_MANAGER()->GetMiXueErCLineups(mapId);
```

### 与上下文系统交互

```cpp
// 从上下文获取状态信息
const g::BotState& state = ctx->BotState();
auto& enemies = ctx->getEnemies();
auto& supply = ctx->GetSupply();

// 向上下文追加动作
ctx->AppendAction(skillAction);
```

## 扩展点

### 添加新角色

1. **创建角色头文件**
```cpp
// src/core/characters/new_character.h
#ifndef NEW_CHARACTER_H
#define NEW_CHARACTER_H

#include "core/characters/character_base.h"

namespace e {

class NewCharacter : public CharacterBase {
 public:
  NewCharacter() = default;

  MatchType CheckQ(BaseContext* ctx) override;
  MatchType CheckC(BaseContext* ctx) override;
  MatchType CheckX(BaseContext* ctx) override;

 private:
  // 角色特有成员
};

}  // namespace e

#endif
```

2. **实现角色逻辑**
```cpp
// src/core/characters/new_character.cc
#include "core/characters/new_character.h"

namespace e {

MatchType NewCharacter::CheckQ(BaseContext* ctx) {
  // 实现Q技能逻辑
  return MatchType::NONE;
}

// ... 其他方法实现

// 注册到工厂
REGISTER_CLASS(CharacterBase, NewCharacter, "new_character");

}  // namespace e
```

3. **添加技能配置数据**
```yaml
# config/data/new_character_lineups.yaml
q_skill_lineups:
  - map_id: 1001
    positions:
      - parent: [100, 200, 50]
        child: [150, 250, 55]
```

### 自定义技能检查顺序

```cpp
class CustomCharacter : public CharacterBase {
 protected:
  std::vector<SkillCheckType> GetGameModeSkillChecks(const GameModeType& game_mode) override {
    // 根据游戏模式返回不同的技能检查顺序
    switch (game_mode) {
      case GameModeType::BOMB:
        return {SkillCheckType::C, SkillCheckType::Q, SkillCheckType::X};
      case GameModeType::TEAM:
        return {SkillCheckType::Q, SkillCheckType::X, SkillCheckType::C};
      default:
        return CharacterBase::GetGameModeSkillChecks(game_mode);
    }
  }

  float GetSkillCheckWeight(const SkillCheckType& skill_check_type) override {
    // 自定义权重
    if (skill_check_type == SkillCheckType::C) {
      return 200.0f;  // C技能最高优先级
    }
    return CharacterBase::GetSkillCheckWeight(skill_check_type);
  }
};
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/characters/character_base.h` | 角色基类定义 |
| `src/core/characters/character_base.cc` | 角色基类实现 |
| `src/core/characters/*.h` | 各角色头文件 |
| `src/core/characters/*.cc` | 各角色实现 |
| `common/clazz/class_factory.h` | 工厂模板 |
