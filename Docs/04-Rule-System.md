# 规则系统 (Rule System)

## 1. 概述

AIServer 的规则系统是一个分层、模块化的 AI 决策框架，用于在 ONNX 模型预测前后进行决策调整。

核心特点：
- **三种规则类型**：前置规则、状态规则、动作解码规则
- **链式执行**：按配置顺序执行规则链
- **YAML 配置**：支持热重载
- **工厂模式**：动态创建规则实例

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     RuleManager (单例)                           │
├─────────────────────────────────────────────────────────────────┤
│  rules_: map<string, vector<BaseRule>>                          │
│                                                                 │
│  key = "{rule_type}_{context_type}_{game_mode}"                │
│  例: "pre_battle_4v4_0"                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    规则链执行                             │   │
│  │                                                         │   │
│  │  Pre Rules ──► Model Predict ──► Post Rules             │   │
│  │  (可跳过模型)                     (动作微调)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. RuleType 枚举

```cpp
enum class RuleType : uint8_t {
  kUnknown = 0,
  kPre = 1,              // 前置规则：模型推理前执行，可跳过模型
  kState = 2,            // 状态规则：修改游戏状态
  kActionDecode = 3      // 动作解码规则：模型推理后执行，微调动作
};
```

## 4. MatchType 返回值

```cpp
enum MatchType {
  MATCH_NONE = 0,         // 规则不匹配，继续下一条
  MATCH_OK = 1,           // 规则匹配，执行特定动作（前置规则跳过模型）
  MATCH_THROUGH = 2,      // 规则匹配，继续执行模型推理
  MATCH_THROUGH_PRE = 3,  // 规则匹配，执行模型但跳过解码规则
};
```

### 返回值含义

| 返回值 | 前置规则 | 状态规则 | 解码规则 |
|-------|---------|---------|---------|
| `MATCH_NONE` | 继续下一条 | 继续下一条 | 继续下一条 |
| `MATCH_OK` | 执行动作，跳过模型 | 执行修改 | 执行修改 |
| `MATCH_THROUGH` | 执行模型推理 | 执行修改 | 执行修改 |
| `MATCH_THROUGH_PRE` | 执行模型但跳过解码 | N/A | N/A |

## 5. BaseRule 基类

**文件位置**: `src/core/rule/base_rule.h`

```cpp
class BaseRule {
 public:
  virtual ~BaseRule() = default;
  virtual void Init() = 0;
  virtual int Match(BaseContext* ctx) = 0;
  virtual const std::string& GetName() const = 0;
};

using BaseRulePtr = std::shared_ptr<BaseRule>;
```

### 规则实现示例

```cpp
// auto_reload_rule.h
class AutoReloadRule : public BaseRule {
 public:
  void Init() override {}

  int Match(BaseContext* ctx) override {
    const g::BotState& bs = ctx->BotState();

    // 检查是否需要换弹
    if (!NeedReload(bs)) {
      return MATCH_NONE;
    }

    // 检查是否安全换弹
    if (!SafeToReload(ctx)) {
      return MATCH_NONE;
    }

    // 执行换弹
    ctx->AppendAction(g::ActionType::ACTION_RELOAD, LOG_SRC);
    return MATCH_OK;
  }

  static const std::string kRuleName;
  const std::string& GetName() const override { return kRuleName; }

  DECLARE_CREATE_FUNCTION(BaseRule, AutoReloadRule)

 private:
  bool NeedReload(const g::BotState& bs);
  bool SafeToReload(BaseContext* ctx);
};

// auto_reload_rule.cc
const std::string AutoReloadRule::kRuleName = "auto_reload";
REGISTER_CLASS("auto_reload", AutoReloadRule, BaseRule);
```

## 6. RuleManager 规则管理器

**文件位置**: `src/core/rule/rule_manager.h`

```cpp
class RuleManager {
  MAKE_SINGLETON(RuleManager);

 public:
  void Initialize();
  std::pair<std::string, int> MatchRules(RuleType rule_type, e::BaseContext* ctx);

 private:
  void ParseRules(const std::vector<std::string>& rule_names,
                  std::vector<std::shared_ptr<e::BaseRule>>* rules);

  // key: "{rule_type}_{context_type}_{game_mode}"
  std::unordered_map<std::string, std::vector<std::shared_ptr<e::BaseRule>>> rules_;
};
```

### MatchRules 实现

```cpp
std::pair<std::string, int> RuleManager::MatchRules(RuleType rule_type,
                                                     e::BaseContext* ctx) {
  // 1. 构建查询键
  auto key = fmt::format("{}_{}_{}", RuleTypeToString(rule_type),
                         ctx->GetContextType(),
                         static_cast<int>(ctx->GetGameMode()));

  // 2. 查询规则链
  auto it = rules_.find(key);
  if (it == rules_.end()) return {"", 0};

  // 3. 顺序执行规则
  for (const auto& rule : it->second) {
    auto start_time = util::time::SteadyTimeNowUS();
    int ret = rule->Match(ctx);
    auto cost_time = util::time::SteadyTimeNowUS() - start_time;

    // 4. 记录时间和结果
    ctx->AddTimecostRecord(GetTag(rule_type), rule->GetName(), cost_time);
    ctx->AddRuleMatchResult(rule->GetName(), ret);

    // 5. 前置规则匹配即返回
    if (ret != MATCH_NONE && rule_type == RuleType::kPre) {
      return {rule->GetName(), ret};
    }
  }

  return {"", 0};
}
```

## 7. 规则执行流程

```
请求处理管道：

┌─────────────────────────────────────────────────────────────────┐
│                        Preprocess                                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              MatchRules(RuleType::kPre, ctx)                     │
├─────────────────────────────────────────────────────────────────┤
│  for each rule in pre_rules:                                    │
│    ret = rule->Match(ctx)                                       │
│    if ret == MATCH_OK:                                          │
│      return (跳过模型推理)                                        │
│    if ret == MATCH_THROUGH:                                     │
│      return (执行模型推理)                                        │
│    if ret == MATCH_THROUGH_PRE:                                 │
│      return (执行模型但跳过解码规则)                               │
│    if ret == MATCH_NONE:                                        │
│      continue (下一条规则)                                       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │ MATCH_OK                │ MATCH_THROUGH/NONE       │
        │ (跳过模型)               │ (执行模型)               │
        │                         │                         │
        │                         ▼                         │
        │         ┌───────────────────────────────────┐     │
        │         │         Model Predict             │     │
        │         │  • 特征提取                        │     │
        │         │  • ONNX 推理                      │     │
        │         │  • 动作编解码                      │     │
        │         └───────────────┬───────────────────┘     │
        │                         │                         │
        │                         ▼                         │
        │         ┌───────────────────────────────────┐     │
        │         │ MatchRules(kActionDecode, ctx)    │     │
        │         │  (除非 MATCH_THROUGH_PRE)         │     │
        │         │  • auto_aim                       │     │
        │         │  • enhance_behavior               │     │
        │         │  • auto_unaim                     │     │
        │         └───────────────────────────────────┘     │
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Finish                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 8. 前置规则列表 (39 个)

### 核心战斗规则

| 规则名 | 功能 |
|-------|------|
| `safe_nav` | 安全导航，避免危险区域 |
| `auto_guard` | 自动防守/举盾 |
| `auto_reload` | 自动换弹 |
| `switch_weapon` | 自动切换武器 |
| `pre_aim` | 预先瞄准 |
| `auto_command` | 自动指挥队伍 |
| `reaction_control` | 反应控制 |
| `handle_special_cases` | 处理特殊情况 |
| `knife_fight` | 近距离格斗 |
| `kill_dying` | 补刀垂死敌人 |
| `sniper_setup` | 狙击手布置 |

### 投掷物管理规则

| 规则名 | 功能 |
|-------|------|
| `bomb_throw` | 投掷手雷（最复杂，1504 行） |
| `throw_healing_grenade` | 投掷治疗手雷 |
| `throw_inceptor` | 投掷拦截者 |
| `hot_zone_throw` | 热点区域投掷 |
| `mine_throw` | 地雷投掷 |
| `payload_throw` | 推车模式投掷物 |
| `auto_rescue` | 自动救援 |

### 技能触发规则

| 规则名 | 功能 |
|-------|------|
| `bomb_skill` | 爆破模式技能 |
| `bomb_tag_bomber` | 标记轰炸机 |
| `bomb_tag_throw` | 标记投掷物 |
| `hot_zone_skill` | 热点技能 |
| `mine_skill` | 地雷技能 |
| `payload_skill` | 推车技能 |
| `gun_king_skill` | 枪王技能 |
| `team_skill` | 团竞模式技能 |
| `zombie_skill` | 生化模式技能 |

### 游戏目标规则

| 规则名 | 功能 |
|-------|------|
| `handle_bomb` | 处理炸弹 |
| `handle_mine` | 处理地雷 |
| `handle_summon` | 处理召唤物 |
| `bomb_lineup` | 爆破预设 |
| `mine_lineup` | 地雷预设 |
| `big_head_throw` | 大头模式投掷 |

### 位置/姿态规则

| 规则名 | 功能 |
|-------|------|
| `stick_hot_zone` | 粘附热点 |
| `stick_car` | 粘附推车 |
| `high_hold` | 高位持枪 |
| `dying_cover` | 死前寻求掩护 |
| `conceal` | 隐身机制 |
| `big_head_skill` | 大头模式技能 |

## 9. 后置规则列表 (5 个)

| 规则名 | 功能 |
|-------|------|
| `auto_aim` | 自动瞄准 + 扰动（最复杂，1223 行） |
| `auto_unaim` | 自动停止瞄准 |
| `assist_aim` | 辅助瞄准 |
| `enhance_behavior` | 增强行为 |
| `switch_2d_rule` | 2D 切换 |

## 10. 复杂规则示例

### 10.1 auto_aim_rule (自动瞄准)

```cpp
int AutoAimRule::Match(BaseContext* ctx) {
  if (!DoCheck(ctx)) {
    ctx->SetAimFrameNum(0);
    return MATCH_NONE;
  }

  const g::BotState& bs = ctx->BotState();

  // 特殊情况：汐 Q 技能激活时面向敌人
  if (bs.m_state.m_actorID == ACTORID::XI &&
      LogicUtils::IsQSkillActive(bs)) {
    auto& enemies = ctx->getAliveSortedDetectedEnemies();
    if (!enemies.empty() && enemies[0].first < 10.0f) {
      const g::NearbyPlayer* nearestEnemy = enemies[0].second;
      float targetYaw = LogicUtils::Yaw(bs.m_state.m_position,
                                        nearestEnemy->m_state.m_position);
      float yawDiff = LogicUtils::ClipAngleReturn(targetYaw - bs.m_camera.m_rotation.m_x);
      if (std::abs(yawDiff) > 5.0f) {
        ctx->RemoveFocusAction(LOG_SRC);
        ctx->ChangeFocusWithTime(targetYaw, targetPitch, 500, LOG_SRC);
        return MATCH_OK;
      }
    }
  }

  // 标准瞄准流程
  float autoAimYaw, autoAimPitch, autoAimFinalYaw, autoAimFinalPitch, autoAimDist;

  if (CanAutoAimEnemyAndObstacle(ctx, autoAimYaw, autoAimPitch,
                                  autoAimFinalYaw, autoAimFinalPitch,
                                  autoAimDist)) {
    // 命中率调整
    float hitRate = 1.0f;
    AdjustHitRate(ctx, autoAimDist, hitRate);

    // 扰动处理
    if (EnableDisturb(ctx, hitRate, ...)) {
      DisturbAngle(ctx, direction, autoAimDist, autoAimYaw, autoAimPitch, info);
    }

    // 应用瞄准
    ctx->ModelChangeFocus(autoAimYaw, autoAimPitch, LOG_SRC);
    ctx->SetAutoAim();
    return MATCH_THROUGH;
  }

  return MATCH_NONE;
}
```

### 10.2 命中率调整

```cpp
bool AutoAimRule::AdjustHitRate(BaseContext* ctx, const float aimDist, float& hitRate) {
  // 1. 距离调整（远距离降低准确率）
  AdjustHitRateByDist(ctx, aimDist, hitRate);

  // 2. 被偷袭调整（被击中 2 帧内命中率减半）
  AdjustHitRateBySneakAttacked(ctx, hitRate);

  // 3. 目标切换调整
  AdjustHitRateByTargetSwitch(ctx, hitRate);

  // 4. 特殊情况（2D、冻结、奔跑等）
  AdjustHitRateBySpecialCase(ctx, hitRate);

  // 5. 剧本风格控制
  AdjustHitRateByDramaStyle(ctx, hitRate);

  // 6. 对 AI 敌人的系数调整
  AdjustHitRateByAIEnemy(ctx, hitRate);

  hitRate = std::max(0.0f, std::min(1.0f, hitRate));
  return true;
}
```

### 10.3 扰动方向

```cpp
void AutoAimRule::DisturbAngle(BaseContext* ctx, DisturbDirection direction,
                               const float aimDist, float& aimYaw,
                               float& aimPitch, std::string& info) {
  float horizontal_disturb_dist = CommonContants::DISTURB_DIST;
  float vertical_disturb_dist = CommonContants::UP_DISTURB_DIST;

  // 低级 AI 加大扰动
  bool lowLevel = ctx->GetLevel() == 1 ||
                  (ctx->GetLevel() == 2 && RANDOM_UFLOAT(0, 1) < 0.5);
  if (lowLevel) {
    horizontal_disturb_dist += std::min(1.f, std::max(0.1f, -0.02 * aimDist + 1.5));
    vertical_disturb_dist += std::min(1.5f, std::max(0.6f, -0.02 * aimDist + 2.1));
  }

  // 计算扰动角度
  float disturbAngle = atan2(horizontal_disturb_dist, aimDist) * 180 / PI;
  float upDisturbAngle = atan2(vertical_disturb_dist, aimDist) * 180 / PI;

  switch (direction) {
    case DisturbDirection::D_LEFT:
      aimYaw -= disturbAngle;
      break;
    case DisturbDirection::D_RIGHT:
      aimYaw += disturbAngle;
      break;
    case DisturbDirection::D_UP:
      aimPitch += upDisturbAngle;
      break;
    // ... 其他方向
  }
}
```

## 11. YAML 配置示例

```yaml
rule:
  stages:
    - name: "pre"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0  # 爆破模式
              rules:
                - "safe_nav"
                - "bomb_throw"
                - "handle_special_cases"
                - "handle_summon"
                - "bomb_lineup"
                - "handle_bomb"
                - "bomb_skill"
                - "auto_reload"
                - "sniper_setup"
                - "auto_guard"
                - "conceal"
                - "pre_aim"
                - "dying_cover"
                - "throw_healing_grenade"
                - "kill_dying"

            - id: 1  # 团竞模式
              rules:
                - "handle_summon"
                - "handle_special_cases"
                - "team_skill"
                - "auto_reload"
                - "throw_healing_grenade"
                - "throw_interceptor"

    - name: "action_decode"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0
              rules:
                - "auto_aim"
                - "enhance_behavior"
                - "auto_unaim"
                - "switch_2d_rule"
```

## 12. 规则键生成规则

```
前置规则键: "pre_{ContextType}_{GameModeId}"
状态规则键: "state_{ContextType}_{GameModeId}"
解码规则键: "action_decode_{ContextType}_{GameModeId}"

示例:
  "pre_battle_4v4_0"           → 爆破模式前置规则
  "pre_team_brawl_1"           → 团竞模式前置规则
  "action_decode_battle_4v4_0" → 爆破模式解码规则
```

## 13. 规则注册系统

```cpp
// 声明创建函数
#define DECLARE_CREATE_FUNCTION(_interface, _class) \
  static _interface* CreateIntance() { return new _class; }

// 注册类
#define REGISTER_CLASS(_tag, _class, _interface) \
  static bool _class##Register = \
      common::clazz::ClassFactory<_interface>::GetInstance()->Insert( \
          _tag, &_class::CreateIntance)

// 使用
// 在 .h 文件中
DECLARE_CREATE_FUNCTION(BaseRule, AutoReloadRule)

// 在 .cc 文件中
REGISTER_CLASS("auto_reload", AutoReloadRule, BaseRule);
```

## 14. 扩展点

### 14.1 添加新规则

1. **创建规则文件** `src/core/rule/pre/new_rule.h`:

```cpp
class NewRule : public BaseRule {
 public:
  void Init() override {}

  int Match(BaseContext* ctx) override {
    // 实现规则逻辑
    if (condition) {
      ctx->AppendAction(...);
      return MATCH_OK;
    }
    return MATCH_NONE;
  }

  static const std::string kRuleName;
  const std::string& GetName() const override { return kRuleName; }
  DECLARE_CREATE_FUNCTION(BaseRule, NewRule)
};
```

2. **注册规则** `src/core/rule/pre/new_rule.cc`:

```cpp
const std::string NewRule::kRuleName = "new_rule";
REGISTER_CLASS("new_rule", NewRule, BaseRule);
```

3. **配置规则** `ai_server.yaml`:

```yaml
rule:
  stages:
    - name: "pre"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0
              rules:
                - "new_rule"  # 添加新规则
                - "safe_nav"
                # ...
```

### 14.2 添加新规则类型

1. 在 `RuleType` 枚举中添加新类型
2. 实现 `StringToRuleType` 和 `RuleTypeToString`
3. 在 `MatchRules` 中处理新类型的执行逻辑
