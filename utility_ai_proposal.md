# Utility AI 模块技术方案

## 1. 背景与动机

### 1.1 当前痛点

AIServer 为数十个角色提供 AI 推理服务。当前角色的技能决策逻辑**全部硬编码在 C++ 代码中**，存在以下问题：

| 问题 | 影响 |
|------|------|
| 每次调整 AI 行为都需要改代码、编译、部署 | 迭代周期长，无法快速响应策划需求 |
| 行为逻辑散落在各角色文件中，格式不统一 | 维护成本高，新人上手困难 |
| 调试需要手动在代码中插入日志 | 排查问题效率低 |
| 策划无法直接参与 AI 行为调优 | 开发人员成为唯一瓶颈 |

### 1.2 为什么不用状态机/行为树？

我们的服务器使用**负载均衡**，请求可能被路由到任意节点。状态机和行为树都是**有状态**的方案：

- 要实现跨节点状态一致，必须在每帧请求的 `extend_info` 中携带完整状态信息
- 每帧都需要反序列化、重建状态树，再序列化回去
- 这在**网络负载**（每帧额外传输状态数据）和**计算性能**（每帧重建状态结构）上都不划算

**Utility AI 天然无状态**——每帧仅依赖当前游戏状态进行评估，完美契合我们的负载均衡架构。

## 2. 什么是 Utility AI

Utility AI 是一种基于**效用评分**的 AI 决策方法。核心思想：

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
        │  释放X技能:  0.85 ★ ← 最高  │
        │  进入熊控制: 0.72           │
        │  使用C技能:  0.45           │
        │  交给模型:   0.30           │
        └─────────────────────────────┘
                      │
                      ▼
              执行「释放X技能」
```

**打分机制**：每个行为由多个**因素（Factor）** 组合计算得分。每个因素 = 输入值 × 响应曲线 × 运算符：

```
行为得分 = f₁(input₁) ○₁ f₂(input₂) ○₂ f₃(input₃) ...

其中：
  inputₙ  = 游戏状态值（如敌人距离、血量百分比）
  fₙ      = 响应曲线（将输入映射到 [0,1] 的效用值）
  ○ₙ      = 运算符（SET / ADD / MULTIPLY / MIN / MAX）
```

### 2.1 支持的响应曲线

系统内置 7 种曲线类型，覆盖常见的决策场景：

| 曲线类型 | 公式 | 适用场景 |
|----------|------|----------|
| **CONSTANT** | y = c | 基准分、开关 |
| **LINEAR** | y = kx + b (clamp[0,1]) | 线性关系（距离越近越好等） |
| **LINEAR_DECAY** | y = 1 - x/max | 线性衰减（血量越低越紧急等） |
| **STEP** | y = x ≥ t ? high : low | 门槛判断（技能是否就绪） |
| **INVERSE** | y = 1/(1+kx) | 快速递减（距离远了急剧下降） |
| **SIGMOID** | y = 1/(1+e^(-k(x-m))) | S形过渡（平滑门槛） |
| **PIECEWISE** | 分段线性插值 | 自定义任意形状的响应 |

## 3. 模块架构

### 3.1 整体结构

```
src/core/utility/
├── utility_types.h              # 数据结构定义（曲线、因素、行为、行为集）
├── utility_curve.h/cc           # 7种响应曲线的计算实现
├── utility_evaluator.h/cc       # 核心评估器（行为集选择 + 打分 + 日志生成）
├── utility_config.h/cc          # 配置管理器（NACOS热更 + YAML解析）
└── providers/
    └── yiweite_utility_provider.h/cc   # 伊维特角色：输入值计算 + 行为执行
```

### 3.2 类图

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
                    │ + Evaluate(set_id, provider)   │──→ UtilityCurve::Evaluate()
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
                    │ - ExecuteUseXSkill(ctx)           │
                    │ - ...14+ 行为执行函数             │
                    └──────────────────────────────────┘
```

### 3.3 请求处理流程

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
│    → 生成对应动作指令                                  │
│                                                      │
│ 5. 自动输出评估日志（无需手动埋点）                      │
└─────────────────────────────────────────────────────┘
    │
    ▼
gRPC 响应返回
```

### 3.4 NACOS 配置热更

```
NACOS 配置中心
    │
    │  utility_yiweite.yaml 变更推送
    ▼
UtilityConfigManager.LoadFromYaml()
    │
    │  解析 YAML → CharacterUtilityConfig
    ▼
UtilityEvaluator.LoadConfig()  ← mutex 保护，线程安全
    │
    ▼
下一帧请求即使用新配置（零停机）
```

## 4. YAML 配置示例

以下为伊维特角色的配置结构（部署在 NACOS 上的 `utility_yiweite.yaml`）：

```yaml
version: "1.0"
character: "yiweite"

# ===== 行为集选择器 =====
# 按顺序检查条件，命中第一个满足的条件后选择对应行为集
behavior_set_selector:
  - condition: "is_manipulating_bear"     # 正在操控熊？
    set: "bear_control_behaviors"
  - condition: "is_x_skill_active"        # X技能释放中？
    set: "x_skill_wait_behaviors"
  - condition: "default"                  # 默认
    set: "normal_behaviors"

# ===== 行为集定义 =====
behavior_sets:

  # —— 普通行为集 ——
  normal_behaviors:
    behaviors:
      - id: "use_x_skill"
        factors:
          - input: "x_skill_ready"          # X技能是否就绪
            op: "set"                       # 第一个因素必须是 set
            curve:
              type: "step"                  # 门槛判断：就绪=1，未就绪=0
              threshold: 0.5
              high: 1.0
              low: 0.0
          - input: "nearest_enemy_distance" # 敌人距离
            op: "multiply"                  # 乘法组合
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

      - id: "hosted_by_model"               # 交给模型控制
        factors:
          - input: "constant_one"
            op: "set"
            curve:
              type: "constant"
              value: 0.3                    # 基准分 0.3，其它行为更优时让步

  # —— 熊控制行为集 ——
  bear_control_behaviors:
    behaviors:
      - id: "bear_charge"
        factors:
          - input: "bear_is_facing_enemy"
            op: "set"
            curve:
              type: "step"
              threshold: 0.5
              high: 1.0
              low: 0.0
      - id: "exit_bear_control"
        factors:
          - input: "master_is_safe"
            op: "set"
            curve:
              type: "step"
              threshold: 0.5
              high: 0.0               # 主人安全时不需要退出
              low: 1.0                # 主人不安全时紧急退出
```

**配置说明**：
- `behavior_set_selector`：条件选择器，按顺序匹配，命中后进入对应行为集
- `behavior_sets`：定义各行为集及其中的行为
- 每个行为由多个 `factors` 组合打分
- `op` 运算符：`set`（赋值）、`add`（加）、`multiply`（乘）、`min`、`max`
- `curve` 响应曲线：定义输入值到效用分数的映射函数

## 5. 自动化调试日志

Utility AI 模块**自动生成**详细的评估日志，无需手动在代码中插入 log：

```
[yiweite utility] set: normal_behaviors
[yiweite utility] selected: use_x_skill
[yiweite utility] details:
  use_x_skill*=0.85(=x_skill_ready:1.00, *nearest_enemy_distance:0.85);
  enter_bear_control=0.48(=has_bear:1.00, *bear_energy:0.48);
  hosted_by_model=0.30(=constant_one:0.30)
```

**日志格式解读**：
- `行为名*` → 带 `*` 标记的是最终选中的行为
- `=0.85` → 该行为的最终效用得分
- `(=x_skill_ready:1.00, *nearest_enemy_distance:0.85)` → 各因素的计算明细
  - `=` SET / `+` ADD / `*` MULTIPLY / `<` MIN / `>` MAX
  - `输入名:曲线输出值`

**对比当前调试方式**：

| | 当前方式 | Utility AI |
|---|---|---|
| 添加日志 | 手动在代码中插入 LOG 语句 | **自动输出**，零额外代码 |
| 日志内容 | 碎片化，需要多处拼凑 | 完整的评估公式+数值，一目了然 |
| 定位问题 | 需要逐段排查代码逻辑 | 直接看哪个因素的分数不对 |
| 开关控制 | 需要改代码重编译 | 日志级别控制即可 |

## 6. 优势总结

### 6.1 热更新能力——不停机调整AI行为

```
修改 NACOS 上的 YAML 配置
        │
        ▼
    自动推送到所有节点
        │
        ▼
    下一帧立即生效（零停机、零编译）
```

- 当前方式：改代码 → 编译 → 部署 → 重启（分钟级）
- Utility AI：改 YAML → 推送 → 生效（秒级）

### 6.2 配置化管理——代码与行为逻辑解耦

| 当前 | Utility AI |
|------|-----------|
| AI 行为散落在各角色 .cc 文件中 | 行为逻辑集中在 YAML 配置中 |
| 修改任何行为都需要改 C++ 代码 | C++ 只负责"能做什么"，YAML 决定"什么时候做" |
| 每个角色的逻辑写法各异 | 统一的配置格式，标准化管理 |

### 6.3 天然适配负载均衡

- **无状态评估**：每帧独立计算，不依赖历史状态
- **无需在 extend_info 中传递状态**：减少网络开销
- **无需重建状态结构**：减少 CPU 开销

### 6.4 渐进式推广路径

```
阶段1（当前）          阶段2              阶段3              阶段4
伊维特单角色验证  →  推广到更多角色  →  抽取通用配置模板  →  全角色覆盖
```

- 目前仅在**伊维特**上验证，风险可控
- 验证可行后，其他角色只需新增 Provider 和 YAML 配置
- 角色间的**通用属性**（血量、距离、技能CD等）可复用，特殊属性单独扩展

### 6.5 策划可参与——降低开发瓶颈

当前所有 AI 行为调优都必须经过开发人员。Utility AI 的 YAML 配置格式结构清晰：

- **短期**：开发人员通过 NACOS 面板直接修改配置调参
- **中期**：开发专用的可视化编辑器，策划人员直接拖拽调整曲线和参数
- **长期**：策划独立完成 AI 行为配置，开发专注于底层能力扩展

### 6.6 可纳入 CI/CD 管理

YAML 配置文件可以：

- 纳入版本管理（Git），有明确的修改记录和 code review
- 集成到 CI/CD 流水线，配置变更可追溯、可回滚
- 支持多环境配置（开发/测试/线上）的独立管理

### 6.7 可扩展性

- **新增曲线类型**：只需在 `UtilityCurve` 中添加一种计算函数
- **新增输入值**：只需在 Provider 中添加一个取值函数
- **新增角色**：新建 Provider + YAML 配置，核心评估器完全复用
- **通用模板**：多个角色可共享相同的行为集配置模板，只在差异部分覆盖

## 7. 伊维特实现概览

伊维特是第一个接入 Utility AI 的角色，作为可行性验证：

### 7.1 已实现的输入值（22项）

| 分类 | 输入值 | 说明 |
|------|--------|------|
| 通用 | `constant_one` | 常量 1.0，用于基准分 |
| 通用 | `nearest_enemy_distance` | 最近敌人距离 |
| 通用 | `health_percent` | 生命值百分比 |
| 通用 | `is_safe` | 是否安全（10帧无伤且敌人远） |
| 通用 | `in_battle` | 是否在战斗中 |
| 通用 | `visible_enemy_count` | 可见敌人数 |
| 技能 | `x_skill_ready` / `q_skill_ready` / `c_skill_ready` | 技能就绪状态 |
| 技能 | `is_x_skill_active` / `is_q_skill_active` / `is_c_skill_active` | 技能激活状态 |
| 伊维特 | `has_bear` | 是否有熊 |
| 伊维特 | `bear_energy` | 熊能量值 |
| 伊维特 | `is_manipulating_bear` | 是否在操控熊 |
| 伊维特 | `bear_is_attacking` | 熊是否在攻击 |
| 伊维特 | `bear_target_distance` | 熊到目标距离 |
| 伊维特 | `master_is_safe` | 操控者是否安全 |
| 伊维特 | `has_blocked_enemy` | 是否有遮挡敌人 |
| 伊维特 | `frames_since_last_damage` | 上次受伤后帧数 |
| 伊维特 | `frames_since_quit_bear` | 退出熊控制后帧数 |
| 伊维特 | `is_facing_enemy` / `bear_is_facing_enemy` | 面朝敌人状态 |
| 伊维特 | `bear_is_facing_car` | 熊是否面朝运载车 |

> 其中「通用」类输入值可直接复用到其他角色，无需重复开发。

### 7.2 已实现的行为（14项）

| 行为集 | 行为 | 说明 |
|--------|------|------|
| 普通 | `use_x_skill` | 释放X技能 |
| 普通 | `use_c_skill` | 释放C技能 |
| 普通 | `raise_bear` | 召唤熊 |
| 普通 | `throw_bear` | 投掷熊 |
| 普通 | `enter_bear_control` | 进入熊控制 |
| 普通 | `hosted_by_model` | 交给模型控制 |
| 熊控制 | `bear_charge` | 熊冲锋/开火 |
| 熊控制 | `bear_throw_snowball` | 熊投掷雪球 |
| 熊控制 | `bear_move_to_target` | 熊移向目标 |
| 熊控制 | `exit_bear_control` | 退出熊控制 |
| 熊控制 | `bear_wait` | 熊等待 |
| 等待 | `wait_x_skill` / `wait_c_skill` / `wait_summon` | 等待技能释放 |
| 等待 | `cancel_skill` | 取消技能 |

## 8. 后续规划

| 阶段 | 内容 | 预期收益 |
|------|------|----------|
| **阶段1** ✅ | 伊维特角色验证 | 验证 Utility AI 在实际对战中的可行性 |
| **阶段2** | 推广到 3-5 个角色 | 积累经验，完善通用输入值库 |
| **阶段3** | 通用 Provider 基类 + 模板配置 | 新角色接入成本降低到仅写差异部分 |
| **阶段4** | 可视化编辑器 | 策划可直接调参，曲线可视化预览 |
| **阶段5** | YAML 配置纳入 CI/CD | 配置变更可追溯、可回滚、多环境管理 |
| **阶段6** | 全角色覆盖 | 所有角色技能决策统一管理 |

## 9. 风险评估与应对

| 风险 | 概率 | 应对措施 |
|------|------|----------|
| YAML 配置错误导致 AI 异常 | 中 | 配置解析时校验 + `hosted_by_model` 兜底行为 |
| 性能开销 | 低 | 每帧仅需评估少量行为（<20个），均为简单数学运算 |
| 推广过程中发现架构缺陷 | 低 | 阶段1验证期充分暴露问题，核心评估器设计已考虑扩展性 |
| 团队学习成本 | 低 | YAML 格式直观，日志自动输出便于理解决策过程 |

## 10. 总结

Utility AI 模块为 AIServer 提供了一套**配置化、可热更、无状态、自动化调试**的 AI 行为决策方案。它不是替代现有的 ONNX 模型推理，而是在角色技能决策层面提供一种更灵活的控制方式。

核心价值：

1. **快速迭代**：YAML 热更，秒级生效，告别"改代码→编译→部署"的漫长周期
2. **天然无状态**：完美适配负载均衡架构，无额外网络和计算开销
3. **统一管理**：数十个角色的行为逻辑用统一格式配置，清晰可维护
4. **自动调试**：评估日志自动输出完整的公式和数值，排查问题效率倍增
5. **降低瓶颈**：配置化+编辑器，策划可参与AI调优，释放开发人力
6. **可追溯**：配置纳入 CI/CD，修改历史清晰，支持回滚
7. **低风险**：从单角色验证起步，渐进推广，始终有模型兜底
