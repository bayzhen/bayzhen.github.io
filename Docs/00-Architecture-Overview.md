# AIServer 架构概述

## 1. 项目简介

AIServer 是一个面向 Strinova（竞技多人射击游戏）的游戏 AI 推理服务。它通过 gRPC 提供实时 AI 决策，结合 ONNX 模型进行神经网络推理，并配合基于规则的系统进行动作精细化处理。

## 2. 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              游戏客户端                                       │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ gRPC (ActionRequest/ActionResponse)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AsyncServer (gRPC 异步服务器)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CQ #0     │  │   CQ #1     │  │   CQ #2     │  │   CQ #N     │        │
│  │  Worker 0   │  │  Worker 1   │  │  Worker 2   │  │  Worker N   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────┬───────┴────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PredictService (服务实现)                            │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      PredictExecutor (三阶段执行器)                     │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │  │
│  │  │ Preprocess  │───▶│   Predict   │───▶│   Finish    │                │  │
│  │  │  (数据预处理) │    │  (模型推理)  │    │  (后处理)   │                │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   RuleManager   │       │  ModelManager   │       │   DataManager   │
│   (规则管理器)   │       │   (模型管理器)   │       │   (数据管理器)   │
│                 │       │                 │       │                 │
│ • Pre Rules     │       │ • ONNX Runtime  │       │ • 地图资源      │
│ • Post Rules    │       │ • Model Selector│       │ • 策略数据      │
│ • State Rules   │       │ • LSTM State    │       │ • Crack 区域    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BaseContext (游戏上下文)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ BombContext  │  │ TeamContext  │  │ ZombieContext│  │ HotZoneContext│   │
│  │   (爆破)      │  │   (团竞)      │  │   (生化)     │  │   (热区)      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. 请求处理管道

```
┌──────────────┐
│ gRPC Request │
│(ActionRequest)│
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Preprocess（预处理阶段）                         │
├──────────────────────────────────────────────────────────────────┤
│ 1. ProtoAdapter: 反序列化 protobuf → 内部数据结构                   │
│ 2. StateAdapter: 状态适配和转换                                    │
│ 3. BuildGameInfo: 构建游戏信息（地图、模式）                         │
│ 4. ParseAllyInfos: 解析队友信息                                    │
│ 5. DramaControl: 等级调整（剧本系统）                               │
│ 6. Context Factory: 创建对应游戏模式的 Context                      │
│ 7. BeginIter: 初始化上下文、恢复历史状态                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Predict（推理阶段）                          │
├──────────────────────────────────────────────────────────────────┤
│ 1. Pre-Rules: 执行前置规则（快速路径，可能跳过模型推理）              │
│ 2. Feature Extraction: 提取特征向量（深度图、单位、目标等）          │
│ 3. Fill LSTM State: 填充历史 LSTM 状态（非首帧）                    │
│ 4. ONNX Inference: 执行 ONNX 模型推理                              │
│ 5. Action Encode: 编码合法动作掩码                                 │
│ 6. Parse Actions: 解析动作概率（Softmax + Mask + Argmax）           │
│ 7. Action Decode: 解码动作标签为具体动作                            │
│ 8. Post-Rules: 执行后置规则（动作微调）                             │
│ 9. Save LSTM State: 保存 LSTM 状态供下一帧使用                      │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Finish（完成阶段）                          │
├──────────────────────────────────────────────────────────────────┤
│ 1. EndIter: 结束上下文迭代、状态持久化                              │
│ 2. GenerateActions: 生成动作列表（按优先级排序）                     │
│ 3. ProtoAdapter: 序列化动作到 protobuf                             │
│ 4. ExtendInfo: 序列化历史数据供下一帧使用                           │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────┐
│ gRPC Response │
│(ActionResponse)│
└───────────────┘
```

## 4. 目录结构说明

```
src/
├── common/                     # 通用组件
│   ├── clazz/                 # 类工厂、单例宏
│   │   ├── class_factory.h    # 类注册和动态创建
│   │   └── singleton.h        # MAKE_SINGLETON 宏
│   ├── config/                # 配置系统
│   │   ├── config_manager.h   # ConfigManager 单例
│   │   └── global_config.h    # 全局配置（双缓冲）
│   ├── log/                   # 日志系统
│   │   └── logger.h           # spdlog 封装
│   ├── metric/                # 指标系统
│   │   └── metric_sink.h      # Prometheus 指标上报
│   └── type/                  # 类型定义
│       ├── ai_common_types.h  # AI 通用类型
│       └── game/              # 游戏类型（Action, State 等）
│
├── core/                       # 核心 AI 逻辑
│   ├── actions/               # 动作编解码（12+ 类型）
│   │   ├── action_base.h      # ActionBase 基类
│   │   ├── action_battle.h    # 战斗模式动作
│   │   ├── action_navigation.h# 导航模式动作
│   │   └── ...
│   ├── adapter/               # Proto ↔ 内部状态转换
│   │   ├── proto_adapter.h    # Protobuf 适配器
│   │   └── state_adapter.h    # 状态适配器
│   ├── characters/            # 角色特定逻辑
│   │   ├── character_base.h   # CharacterBase 基类
│   │   ├── aika.h             # 艾卡
│   │   ├── ming.h             # 明
│   │   └── ...                # 52 个角色
│   ├── config/                # 核心配置
│   │   ├── game_config.h      # 游戏配置
│   │   └── drama_config.h     # 剧本配置
│   ├── context/               # 游戏状态上下文
│   │   ├── base_context.h     # BaseContext 基类
│   │   ├── bomb_context.h     # 爆破模式
│   │   ├── team_context.h     # 团竞模式
│   │   └── ...                # 11 种游戏模式
│   ├── data/                  # 数据管理
│   │   ├── data_manager.h     # DataManager 单例
│   │   ├── data_types.h       # 数据类型定义
│   │   └── grid_key.h         # GridKey 网格索引
│   ├── factory/               # 工厂类
│   │   └── character_factory.h# 角色工厂
│   ├── features/              # ML 特征提取
│   │   ├── feature_manager.h  # FeatureManager
│   │   ├── feature_base.h     # FeatureBase 基类
│   │   ├── feature_unit.h     # 单位特征
│   │   └── ...                # 12+ 特征提取器
│   ├── graph/                 # 寻路系统
│   │   ├── strategy_graph.h   # StrategyGraph 单例
│   │   ├── graph.h            # Graph 类
│   │   └── resource/          # 地图资源（路点、邻接表）
│   ├── model/                 # 模型推理
│   │   ├── model_manager.h    # ModelManager 单例
│   │   ├── model_config.h     # 模型配置
│   │   ├── model_selector.h   # 模型选择器
│   │   └── predict_model.h    # 推理封装
│   ├── module/                # 专用游戏模块（30+）
│   │   ├── detected_enemies_module.h  # 敌人检测
│   │   ├── cover_module.h     # 掩体系统
│   │   ├── bomb_strategy_module.h     # 爆破策略
│   │   └── ...
│   ├── obj/                   # 3D 渲染
│   │   ├── obj_manager.h      # ObjManager 单例
│   │   ├── obj_render.h       # 渲染器
│   │   ├── depth/             # 深度图生成
│   │   ├── line_trace/        # 射线追踪
│   │   └── file/              # OBJ 文件解析
│   ├── predict/               # ONNX 推理引擎
│   │   ├── onnx_engine.h      # ONNX Runtime 封装
│   │   ├── onnx_predictor.h   # 预测器
│   │   └── input_tensor.h     # 张量管理
│   └── rule/                  # 规则系统
│       ├── rule_manager.h     # RuleManager 单例
│       ├── base_rule.h        # BaseRule 基类
│       ├── pre/               # 前置规则（39 个）
│       └── post/              # 后置规则（5 个）
│
├── service/                    # gRPC 服务层
│   ├── grpc/                  # gRPC 基础设施
│   │   ├── async_server.h     # AsyncServer 模板
│   │   ├── async_server_data.h# 请求数据容器
│   │   └── server_config.h    # 服务配置
│   ├── predict_service.h      # PredictService 实现
│   └── predict_executor.h     # 三阶段执行器
│
├── server/                     # 主入口
│   ├── ai_server.cc           # main() 函数
│   └── server_config.h        # 服务器配置
│
├── util/                       # 通用工具
│   ├── container/             # 容器工具
│   │   ├── enable_double_store.h  # 双缓冲
│   │   └── atomic_double_store.h  # 原子双缓冲
│   ├── yaml/                  # YAML 工具
│   │   └── yaml_util.h        # SafeAs 模板
│   ├── time/                  # 时间工具
│   └── system/                # 系统工具
│
├── proto/                      # Protobuf 定义
│   └── strinova/
│       └── action_service.proto  # gRPC 服务定义
│
└── config/                     # 配置文件
    ├── ai_server.yaml         # 主配置文件
    ├── model/                 # 模型配置
    │   └── battle_4v4/        # 战斗模式模型
    │       ├── model.yaml     # 模型参数
    │       └── feature.yaml   # 特征配置
    └── csv/                   # CSV 数据文件
        └── crack.csv          # Crack 区域
```

## 5. 核心设计模式汇总

| 设计模式 | 应用位置 | 作用 |
|---------|---------|------|
| **单例模式** | ConfigManager, ModelManager, RuleManager, DataManager, ObjManager | 全局状态管理，确保唯一实例 |
| **工厂模式** | CharacterFactory, ClassFactory, Context Factory | 动态创建类实例，解耦创建和使用 |
| **模板方法** | AsyncServer, ActionBase, FeatureBase, BaseRule | 定义算法骨架，子类实现细节 |
| **策略模式** | ModelSelector, Context 子类 | 运行时选择不同的算法/策略 |
| **观察者模式** | gRPC CompletionQueue, NACOS ConfigListener | 异步事件处理和配置推送 |
| **双缓冲模式** | EnableDoubleStore, DoubleStore | 无锁读取、原子切换配置 |
| **适配器模式** | ProtoAdapter, StateAdapter | 不同数据格式之间的转换 |
| **建造者模式** | grpc::ServerBuilder | 复杂对象的分步构建 |
| **组合模式** | Context + Modules | 游戏状态的层次化组织 |
| **RAII** | AsyncServerData (Arena), ObjContext | 资源自动管理 |

## 6. 关键单例管理器一览

| 管理器 | 文件路径 | 职责 |
|-------|---------|------|
| **ConfigManager** | `src/common/config/config_manager.h` | 配置加载、NACOS 集成、热更新 |
| **ModelManager** | `src/core/model/model_manager.h` | ONNX 模型加载、推理、选择 |
| **RuleManager** | `src/core/rule/rule_manager.h` | 规则注册、执行、链式调用 |
| **DataManager** | `src/core/data/data_manager.h` | 地图资源、策略数据、Crack 区域 |
| **ObjManager** | `src/core/obj/obj_manager.h` | OSMesa 渲染、深度图、射线追踪 |
| **StrategyGraph** | `src/core/graph/strategy_graph.h` | 寻路图、路径算法、势力计算 |
| **GameInfoManager** | `src/core/game_info_manager.h` | 游戏信息映射（武器、角色） |
| **Logger** | `src/common/log/logger.h` | 日志输出（spdlog） |
| **MetricSink** | `src/common/metric/metric_sink.h` | Prometheus 指标上报 |

## 7. 初始化顺序

```cpp
int main() {
    // 1. 信号处理
    signal(SIGTERM, ShutdownGracefully);
    signal(SIGINT, ShutdownGracefully);

    // 2. 配置初始化（最先）
    ConfigManager::GetInstance()->Initialize();

    // 3. 日志初始化
    Logger::GetInstance()->Initialize();

    // 4. 指标初始化
    MetricSink::GetInstance()->Initialize();

    // 5. 并行初始化核心管理器
    boost::thread_group init_threads;
    init_threads.create_thread([]() {
        ModelManager::GetInstance()->Initialize();      // 加载 ONNX 模型
    });
    init_threads.create_thread([]() {
        RuleManager::GetInstance()->Initialize();       // 加载规则
    });
    init_threads.create_thread([]() {
        ObjManager::GetInstance()->Initialize();        // 初始化 OpenGL
    });
    init_threads.create_thread([]() {
        DataManager::GetInstance()->Initialize();       // 加载地图资源
    });
    init_threads.create_thread([]() {
        StrategyGraph::GetInstance()->Initialize();     // 初始化寻路图
    });
    init_threads.join_all();

    // 6. 启动 gRPC 服务
    auto server = std::make_unique<AsyncServer<...>>(...);
    server->Start();

    // 7. 等待关闭信号
    // ...

    return 0;
}
```

## 8. 性能关键路径

```
关键路径延迟分解（目标 < 10ms）:

┌─────────────────────────────────────────────────────────────────┐
│ Preprocess (预处理)                              ~1-2ms         │
│  ├─ Protobuf 反序列化                           ~0.2ms         │
│  ├─ 状态适配                                    ~0.3ms         │
│  ├─ Context 创建和初始化                        ~0.5ms         │
│  └─ BeginIter                                   ~0.5ms         │
├─────────────────────────────────────────────────────────────────┤
│ Predict (推理)                                   ~5-7ms         │
│  ├─ Pre-Rules 匹配                              ~0.5ms         │
│  ├─ 深度图渲染 (OSMesa)                         ~1.5ms         │
│  ├─ 射线追踪 (LineTrace)                        ~0.5ms         │
│  ├─ 特征提取                                    ~0.5ms         │
│  ├─ ONNX 推理                                   ~2.0ms         │
│  ├─ 动作编解码                                  ~0.3ms         │
│  └─ Post-Rules 执行                             ~0.5ms         │
├─────────────────────────────────────────────────────────────────┤
│ Finish (完成)                                    ~0.5-1ms       │
│  ├─ EndIter                                     ~0.2ms         │
│  ├─ 动作生成                                    ~0.2ms         │
│  └─ Protobuf 序列化                             ~0.1ms         │
└─────────────────────────────────────────────────────────────────┘
```

## 9. 扩展点

### 9.1 添加新游戏模式
1. 创建 `src/core/context/new_mode_context.h`，继承 `BaseContext`
2. 实现 `BeginInternal()` 和 `EndInternal()` 方法
3. 注册到 Context 工厂
4. 在 `RuleConfig` 中添加新模式的规则配置

### 9.2 添加新规则
1. 创建规则文件 `src/core/rule/pre/new_rule.h`
2. 继承 `BaseRule`，实现 `Match()` 方法
3. 使用 `REGISTER_CLASS` 宏注册
4. 在 `ai_server.yaml` 的 `rule.stages` 中添加配置

### 9.3 添加新特征提取器
1. 创建 `src/core/features/feature_new.h`
2. 继承 `FeatureBase`，实现 `ExtractFeatures()` 方法
3. 使用 `REGISTER_CLASS` 宏注册
4. 在 `feature.yaml` 中添加配置

### 9.4 添加新角色
1. 创建 `src/core/characters/new_character.h`
2. 继承 `CharacterBase`，实现技能检查方法
3. 在 `CharacterFactory` 中添加创建函数
4. 更新 `ACTORID` 枚举

## 10. 监控指标

Prometheus 指标暴露在 `http://127.0.0.1:10188/metrics`：

| 指标名 | 类型 | 说明 |
|-------|------|------|
| `predict_request_total` | Counter | 总请求数 |
| `predict_request_duration_ms` | Histogram | 请求延迟分布 |
| `depth_render_duration_us` | Histogram | 深度图渲染时间 |
| `line_trace_duration_us` | Histogram | 射线追踪时间 |
| `onnx_inference_duration_us` | Histogram | ONNX 推理时间 |
| `rule_match_duration_us` | Histogram | 规则匹配时间 |
| `error_depth_total` | Counter | 深度渲染错误数 |
| `error_line_trace_total` | Counter | 射线追踪错误数 |
