---
layout: article
title: "架构概述"
description: "整体系统架构、请求处理管道、核心设计模式与扩展点"
level: intermediate
tags: ["架构", "系统设计"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 0
next:
  title: "配置系统"
  url: "01-config-system.html"
---

## 1. 项目简介

这是一个面向实时多人对战游戏的AI推理服务。它通过gRPC提供实时AI决策，结合ONNX模型进行神经网络推理，并配合基于规则的系统进行动作精细化处理。

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
│ • State Rules   │       │ • LSTM State    │       │ • 战略区域      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
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
│   ├── config/                # 配置系统
│   ├── log/                   # 日志系统
│   ├── metric/                # 指标系统
│   └── type/                  # 类型定义
│
├── core/                       # 核心 AI 逻辑
│   ├── actions/               # 动作编解码（12+ 类型）
│   ├── adapter/               # Proto ↔ 内部状态转换
│   ├── characters/            # 角色特定逻辑
│   ├── context/               # 游戏状态上下文
│   ├── data/                  # 数据管理
│   ├── features/              # ML 特征提取
│   ├── graph/                 # 寻路系统
│   ├── model/                 # 模型推理
│   ├── module/                # 专用游戏模块（30+）
│   ├── obj/                   # 3D 渲染
│   ├── predict/               # ONNX 推理引擎
│   └── rule/                  # 规则系统
│
├── service/                    # gRPC 服务层
│   ├── grpc/                  # gRPC 基础设施
│   ├── predict_service.h      # PredictService 实现
│   └── predict_executor.h     # 三阶段执行器
│
└── server/                     # 主入口
    └── ai_server.cc           # main() 函数
```

## 5. 核心设计模式汇总

| 设计模式 | 应用位置 | 作用 |
| --- | --- | --- |
| 单例模式 | ConfigManager, ModelManager, RuleManager, DataManager, ObjManager | 全局状态管理，确保唯一实例 |
| 工厂模式 | CharacterFactory, ClassFactory, Context Factory | 动态创建类实例，解耦创建和使用 |
| 模板方法 | AsyncServer, ActionBase, FeatureBase, BaseRule | 定义算法骨架，子类实现细节 |
| 策略模式 | ModelSelector, Context 子类 | 运行时选择不同的算法/策略 |
| 观察者模式 | gRPC CompletionQueue, NACOS ConfigListener | 异步事件处理和配置推送 |
| 双缓冲模式 | EnableDoubleStore, DoubleStore | 无锁读取、原子切换配置 |
| 适配器模式 | ProtoAdapter, StateAdapter | 不同数据格式之间的转换 |
| RAII | AsyncServerData (Arena), ObjContext | 资源自动管理 |

## 6. 关键单例管理器一览

| 管理器 | 职责 |
| --- | --- |
| ConfigManager | 配置加载、NACOS 集成、热更新 |
| ModelManager | ONNX 模型加载、推理、选择 |
| RuleManager | 规则注册、执行、链式调用 |
| DataManager | 地图资源、策略数据、战略区域 |
| ObjManager | OSMesa 渲染、深度图、射线追踪 |
| StrategyGraph | 寻路图、路径算法、势力计算 |

## 7. 初始化顺序

```
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

1. 创建新的 Context 子类，继承 `BaseContext`
2. 实现 `BeginInternal()` 和 `EndInternal()` 方法
3. 注册到 Context 工厂
4. 在 `RuleConfig` 中添加新模式的规则配置

### 9.2 添加新规则

1. 创建规则文件，继承 `BaseRule`
2. 实现 `Match()` 方法
3. 使用 `REGISTER_CLASS` 宏注册
4. 在配置文件的规则阶段中添加配置

### 9.3 添加新特征提取器

1. 创建特征提取器，继承 `FeatureBase`
2. 实现 `ExtractFeatures()` 方法
3. 使用 `REGISTER_CLASS` 宏注册
4. 在特征配置文件中添加配置

## 10. 监控指标

Prometheus 指标暴露示例：

| 指标名 | 类型 | 说明 |
| --- | --- | --- |
| predict_request_total | Counter | 总请求数 |
| predict_request_duration_ms | Histogram | 请求延迟分布 |
| depth_render_duration_us | Histogram | 深度图渲染时间 |
| line_trace_duration_us | Histogram | 射线追踪时间 |
| onnx_inference_duration_us | Histogram | ONNX 推理时间 |
| rule_match_duration_us | Histogram | 规则匹配时间 |
