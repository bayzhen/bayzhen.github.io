---
layout: series-index
title: "游戏AI推理服务设计"
description: "面向实时对战游戏的高性能AI决策系统架构与实现"
series_id: ai-inference-server
title_suffix: "陈栢成"
---

## 系列概述

本系列文章详细介绍了一个面向实时多人对战游戏的AI推理服务架构设计与实现。该系统通过gRPC提供实时AI决策，结合ONNX模型进行神经网络推理，并配合基于规则的系统进行动作精细化处理。

核心技术栈：

- **C++17** - 高性能服务端开发
- **gRPC** - 异步RPC通信框架
- **ONNX Runtime** - 神经网络推理引擎
- **OSMesa** - 离屏OpenGL渲染
- **YAML** - 配置管理与热更新
