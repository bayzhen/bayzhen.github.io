---
layout: article
title: "Utility AI决策系统"
description: "基于效用评分的无状态AI行为决策、响应曲线、YAML配置热更新"
level: intermediate
tags: ["Utility AI", "决策系统", "热更新"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 12
prev:
  title: "3D渲染系统"
  url: "11-3d-rendering.html"
next:
  title: "返回目录"
  url: "index.html"
---

## 1. 背景与动机

AIServer 为数十个角色提供 AI 推理服务。此前角色的技能决策逻辑全部硬编码在 C++ 代码中，存在以下问题：

- 每次调整 AI 行为都需要改代码、编译、部署，迭代周期长
- 行为逻辑散落在各角色文件中，格式不统一，维护成本高
- 调试需要手动在代码中插入日志，排查效率低
- 策划无法直接参与 AI 行为调优，开发人员成为唯一瓶颈

### 为什么不用状态机/行为树？

我们的服务器使用负载均衡，请求可能被路由到任意节点。状态机和行为树都是有状态的方案——需要在每帧请求的 `extend_info` 中携带完整状态信息，每帧反序列化、重建状态树再序列化回去，在网络负载和计算性能上都不划算。

**Utility AI 天然无状态**——每帧仅依赖当前游戏状态进行评估，完美契合负载均衡架构。

## 2. 什么是 Utility AI

Utility AI 是一种基于效用评分的 AI 决策方法。核心思想：

> 列出所有候选行为 → 对每个行为打分 → 选择得分最高的行为执行

```
┌──────────────────────────────────────────────────────────┐
│                   当前游戏状态（一帧）                      │
│  敌人距离=25  生命值=80%  X技能就绪  熊能量=60  ...       │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Utility Evaluator 评估器   │
        │                             │
        │  释放X技能:  0.85  ← 最高   │
        │  进入熊控制: 0.72           │
        │  使用C技能:  0.45           │
        │  交给模型:   0.30           │
        └─────────────────────────────┘
                      │
                      ▼
              执行「释放X技能」
```

### 打分机制

每个行为由多个**因素（Factor）**组合计算得分。每个因素 = 输入值 × 响应曲线 × 运算符：

```
行为得分 = f1(input1) ○1 f2(input2) ○2 f3(input3) ...

其中：
  inputN  = 游戏状态值（如敌人距离、血量百分比）
  fN      = 响应曲线（将输入映射到 [0,1] 的效用值）
  ○N      = 运算符（SET / ADD / MULTIPLY / MIN / MAX）
```

## 3. 响应曲线

系统内置 7 种曲线类型，覆盖常见的决策场景：

| 曲线类型 | 公式 | 适用场景 |
| --- | --- | --- |
| CONSTANT | y = c | 基准分、开关 |
| LINEAR | y = kx + b (clamp[0,1]) | 线性关系（距离越近越好等） |
| LINEAR_DECAY | y = 1 - x/max | 线性衰减（血量越低越紧急等） |
| STEP | y = x ≥ t ? high : low | 门槛判断（技能是否就绪） |
| INVERSE | y = 1/(1+kx) | 快速递减（距离远了急剧下降） |
| SIGMOID | y = 1/(1+e^(-k(x-m))) | S形过渡（平滑门槛） |
| PIECEWISE | 分段线性插值 | 自定义任意形状的响应 |

## 4. 模块架构

```
src/core/utility/
├── utility_types.h              # 数据结构定义（曲线、因素、行为、行为集）
├── utility_curve.h/cc           # 7种响应曲线的计算实现
├── utility_evaluator.h/cc       # 核心评估器（行为集选择 + 打分 + 日志生成）
├── utility_config.h/cc          # 配置管理器（NACOS热更 + YAML解析）
└── providers/
    └── yiweite_utility_provider.h/cc   # 伊维特角色：输入值计算 + 行为执行
```

### 类图

```
UtilityConfigManager (Singleton)
                ┌───────────────────────────┐
                │ + GetEvaluator(character)  │
                │ + LoadFromYaml(node)       │
                │ - evaluators_: map<id, ev> │
                └──────────┬────────────────┘
                           │ 管理
                           ▼
                UtilityEvaluator (per character)
                ┌───────────────────────────────┐
                │ + LoadConfig(config)           │
                │ + SelectBehaviorSet(checker)   │
                │ + Evaluate(set_id, provider)   │──> UtilityCurve::Evaluate()
                │ + EvaluateBehavior(behavior)   │
                │ - GenerateLogDetail()          │
                └───────────────────────────────┘
                           ▲
                           │ 调用
                YiWeiTeUtilityProvider
                ┌──────────────────────────────────┐
                │ + CreateInputProvider(ctx)        │
                │ + CreateConditionChecker(ctx)     │
                │ + ExecuteBehavior(ctx, behavior)  │
                │ - GetNearestEnemyDistance(ctx)    │
                │ - GetHealthPercent(ctx)           │
                │ - ...22+ 输入值计算函数           │
                └──────────────────────────────────┘
```

## 5. 请求处理流程

```
gRPC 请求进入
    │
    ▼
PredictExecutor → Character.CheckGameModeSkill()
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ 1. 获取评估器                                         │
│    evaluator = UTILITY_CONFIG_MANAGER()              │
│                  ->GetEvaluator("yiweite")           │
│                                                      │
│ 2. 选择行为集                                         │
│    condition_checker 检查当前状态                      │
│    → "is_manipulating_bear" ? → bear_control 行为集   │
│    → "is_x_skill_active"   ? → x_skill_wait 行为集   │
│    → "default"             ? → normal 行为集          │
│                                                      │
│ 3. 评估所有候选行为并打分                               │
│    input_provider 提供游戏状态值                       │
│    → 每个行为 × 每个因素 × 响应曲线 → 效用分数         │
│    → 选出最高分行为                                    │
│                                                      │
│ 4. 执行选中的行为                                      │
│    ExecuteBehavior(ctx, "use_x_skill")               │
│                                                      │
│ 5. 自动输出评估日志（无需手动埋点）                      │
└─────────────────────────────────────────────────────┘
```

## 6. YAML 配置与热更新

行为逻辑通过 YAML 配置定义，部署在 NACOS 配置中心，支持零停机热更新：

```
NACOS 配置中心
    │  utility_yiweite.yaml 变更推送
    ▼
UtilityConfigManager.LoadFromYaml()
    │  解析 YAML → CharacterUtilityConfig
    ▼
UtilityEvaluator.LoadConfig()  ← mutex 保护，线程安全
    │
    ▼
下一帧请求即使用新配置（零停机）
```

### 配置示例

```
version: "1.0"
character: "yiweite"

# 行为集选择器：按顺序检查条件，命中第一个满足的条件后选择对应行为集
behavior_set_selector:
  - condition: "is_manipulating_bear"     # 正在操控熊？
    set: "bear_control_behaviors"
  - condition: "is_x_skill_active"        # X技能释放中？
    set: "x_skill_wait_behaviors"
  - condition: "default"                  # 默认
    set: "normal_behaviors"

# 行为集定义
behavior_sets:
  normal_behaviors:
    behaviors:
      - id: "use_x_skill"
        factors:
          - input: "x_skill_ready"          # X技能是否就绪
            op: "set"
            curve:
              type: "step"                  # 门槛判断：就绪=1，未就绪=0
              threshold: 0.5
              high: 1.0
              low: 0.0
          - input: "nearest_enemy_distance"
            op: "multiply"
            curve:
              type: "inverse"               # 距离越远分数越低
              k: 0.1

      - id: "enter_bear_control"
        factors:
          - input: "has_bear"
            op: "set"
            curve:
              type: "step"
              threshold: 0.5
              high: 1.0
              low: 0.0
          - input: "bear_energy"
            op: "multiply"
            curve:
              type: "linear"
              k: 0.01
              b: 0.0

      - id: "hosted_by_model"               # 兜底：交给模型控制
        factors:
          - input: "constant_one"
            op: "set"
            curve:
              type: "constant"
              value: 0.3                    # 基准分 0.3，其它行为更优时让步
```

配置要点：

- `behavior_set_selector`：条件选择器，按顺序匹配，命中后进入对应行为集
- 每个行为由多个 `factors` 组合打分
- `op` 运算符：`set`（赋值）、`add`（加）、`multiply`（乘）、`min`、`max`
- `curve` 响应曲线：定义输入值到效用分数的映射函数

## 7. 自动化调试日志

Utility AI 模块自动生成详细的评估日志，无需手动埋点：

```
[yiweite utility] set: normal_behaviors
[yiweite utility] selected: use_x_skill
[yiweite utility] details:
  use_x_skill*=0.85(=x_skill_ready:1.00, *nearest_enemy_distance:0.85);
  enter_bear_control=0.48(=has_bear:1.00, *bear_energy:0.48);
  hosted_by_model=0.30(=constant_one:0.30)
```

日志格式解读：

- `行为名*` — 带 `*` 标记的是最终选中的行为
- `=0.85` — 该行为的最终效用得分
- 括号内为各因素明细：`=` SET / `+` ADD / `*` MULTIPLY / `<` MIN / `>` MAX

|  | 硬编码方式 | Utility AI |
| --- | --- | --- |
| 添加日志 | 手动插入 LOG 语句 | 自动输出，零额外代码 |
| 日志内容 | 碎片化，需多处拼凑 | 完整评估公式+数值 |
| 定位问题 | 逐段排查代码逻辑 | 直接看哪个因素分数异常 |
| 开关控制 | 改代码重编译 | 日志级别控制即可 |

## 8. 实现概览：伊维特角色

伊维特是第一个接入 Utility AI 的角色，作为可行性验证。

### 已实现的输入值（22项）

| 分类 | 输入值 | 说明 |
| --- | --- | --- |
| 通用 | nearest_enemy_distance | 最近敌人距离 |
| 通用 | health_percent | 生命值百分比 |
| 通用 | is_safe | 是否安全（10帧无伤且敌人远） |
| 通用 | in_battle | 是否在战斗中 |
| 技能 | x/q/c_skill_ready | 技能就绪状态 |
| 伊维特 | has_bear/bear_energy | 熊相关状态 |
| 伊维特 | is_manipulating_bear | 是否在操控熊 |
| 伊维特 | bear_target_distance | 熊到目标距离 |

其中「通用」类输入值可直接复用到其他角色，无需重复开发。

### 已实现的行为（14项）

| 行为集 | 行为 | 说明 |
| --- | --- | --- |
| 普通 | use_x_skill/use_c_skill | 释放技能 |
| 普通 | raise_bear/throw_bear | 召唤/投掷熊 |
| 普通 | enter_bear_control | 进入熊控制 |
| 普通 | hosted_by_model | 兜底：交给模型控制 |
| 熊控制 | bear_charge/bear_throw_snowball | 熊攻击行为 |
| 熊控制 | exit_bear_control | 退出熊控制 |
| 等待 | wait_x_skill/cancel_skill | 等待/取消技能释放 |

## 9. 优势总结

| 维度 | 硬编码方式 | Utility AI |
| --- | --- | --- |
| 迭代速度 | 改代码 → 编译 → 部署（分钟级） | 改 YAML → 推送 → 生效（秒级） |
| 状态管理 | 需要跨节点同步状态 | 天然无状态，适配负载均衡 |
| 行为管理 | 散落在各角色 .cc 文件中 | 统一 YAML 配置，标准化管理 |
| 调试效率 | 手动插入日志，碎片化 | 自动输出完整评估公式和数值 |
| 协作模式 | 开发人员是唯一瓶颈 | 策划可参与配置调优 |
| 版本管理 | 混在业务代码中 | YAML 纳入 Git / CI/CD，可追溯回滚 |

## 10. 扩展与推广路径

系统设计充分考虑了可扩展性：

- **新增曲线类型**：在 `UtilityCurve` 中添加一种计算函数
- **新增输入值**：在 Provider 中添加一个取值函数
- **新增角色**：新建 Provider + YAML 配置，核心评估器完全复用

推广路径：

1. **阶段1**（已完成）：伊维特单角色验证
2. **阶段2**：推广到 3-5 个角色，完善通用输入值库
3. **阶段3**：通用 Provider 基类 + 模板配置，降低新角色接入成本
4. **阶段4**：可视化编辑器，策划可直接调参
5. **阶段5**：YAML 配置纳入 CI/CD，多环境管理
6. **阶段6**：全角色覆盖
