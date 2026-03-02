---
layout: article
title: "规则系统"
description: "前置/后置规则、链式执行、工厂模式与规则注册"
level: intermediate
tags: ["规则引擎", "设计模式"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 4
prev:
  title: "模型推理系统"
  url: "03-model-inference.html"
next:
  title: "动作系统"
  url: "05-action-system.html"
---

## 1. 概述

规则系统是一个分层、模块化的 AI 决策框架，用于在 ONNX 模型预测前后进行决策调整。

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

## 3. RuleType 与 MatchType

```
enum class RuleType : uint8_t {
  kUnknown = 0,
  kPre = 1,              // 前置规则：模型推理前执行，可跳过模型
  kState = 2,            // 状态规则：修改游戏状态
  kActionDecode = 3      // 动作解码规则：模型推理后执行，微调动作
};

enum MatchType {
  MATCH_NONE = 0,         // 规则不匹配，继续下一条
  MATCH_OK = 1,           // 规则匹配，执行特定动作（前置规则跳过模型）
  MATCH_THROUGH = 2,      // 规则匹配，继续执行模型推理
  MATCH_THROUGH_PRE = 3,  // 规则匹配，执行模型但跳过解码规则
};
```

| 返回值 | 前置规则 | 状态规则 | 解码规则 |
| --- | --- | --- | --- |
| MATCH_NONE | 继续下一条 | 继续下一条 | 继续下一条 |
| MATCH_OK | 执行动作，跳过模型 | 执行修改 | 执行修改 |
| MATCH_THROUGH | 执行模型推理 | 执行修改 | 执行修改 |
| MATCH_THROUGH_PRE | 执行模型但跳过解码 | N/A | N/A |

## 4. BaseRule 基类

```
class BaseRule {
 public:
  virtual ~BaseRule() = default;
  virtual void Init() = 0;
  virtual int Match(BaseContext* ctx) = 0;
  virtual const std::string& GetName() const = 0;
};

// 规则实现示例
class AutoReloadRule : public BaseRule {
 public:
  void Init() override {}

  int Match(BaseContext* ctx) override {
    const auto& bs = ctx->BotState();

    // 检查是否需要换弹
    if (!NeedReload(bs)) {
      return MATCH_NONE;
    }

    // 检查是否安全换弹
    if (!SafeToReload(ctx)) {
      return MATCH_NONE;
    }

    // 执行换弹
    ctx->AppendAction(ActionType::ACTION_RELOAD, LOG_SRC);
    return MATCH_OK;
  }

  static const std::string kRuleName;
  const std::string& GetName() const override { return kRuleName; }

  DECLARE_CREATE_FUNCTION(BaseRule, AutoReloadRule)
};

// 注册
const std::string AutoReloadRule::kRuleName = "auto_reload";
REGISTER_CLASS("auto_reload", AutoReloadRule, BaseRule);
```

## 5. 规则执行流程

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

## 6. 前置规则列表

### 核心战斗规则

| 规则名 | 功能 |
| --- | --- |
| safe_nav | 安全导航，避免危险区域 |
| auto_guard | 自动防守/举盾 |
| auto_reload | 自动换弹 |
| switch_weapon | 自动切换武器 |
| pre_aim | 预先瞄准 |
| reaction_control | 反应控制 |
| kill_dying | 补刀垂死敌人 |

### 投掷物管理规则

| 规则名 | 功能 |
| --- | --- |
| bomb_throw | 投掷手雷 |
| throw_healing_grenade | 投掷治疗手雷 |
| auto_rescue | 自动救援 |

## 7. 后置规则列表

| 规则名 | 功能 |
| --- | --- |
| auto_aim | 自动瞄准 + 扰动 |
| auto_unaim | 自动停止瞄准 |
| assist_aim | 辅助瞄准 |
| enhance_behavior | 增强行为 |

## 8. 瞄准规则示例

```
int AutoAimRule::Match(BaseContext* ctx) {
  if (!DoCheck(ctx)) {
    ctx->SetAimFrameNum(0);
    return MATCH_NONE;
  }

  float autoAimYaw, autoAimPitch, autoAimDist;

  if (CanAutoAimEnemyAndObstacle(ctx, autoAimYaw, autoAimPitch, autoAimDist)) {
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

## 9. YAML 配置示例

```
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
                - "auto_reload"
                - "auto_guard"
                - "pre_aim"

            - id: 1  # 团竞模式
              rules:
                - "auto_reload"
                - "throw_healing_grenade"

    - name: "action_decode"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0
              rules:
                - "auto_aim"
                - "enhance_behavior"
                - "auto_unaim"
```

## 10. 扩展点：添加新规则

```
// 1. 创建规则文件
class NewRule : public BaseRule {
 public:
  void Init() override {}

  int Match(BaseContext* ctx) override {
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

// 2. 注册规则
const std::string NewRule::kRuleName = "new_rule";
REGISTER_CLASS("new_rule", NewRule, BaseRule);

// 3. 配置规则
// rule.stages[].contexts[].modes[].rules 中添加 "new_rule"
```
