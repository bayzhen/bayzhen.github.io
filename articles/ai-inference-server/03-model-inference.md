---
layout: article
title: "模型推理系统"
description: "ONNX Runtime集成、LSTM状态管理、多模型动态选择"
level: advanced
tags: ["ONNX", "推理"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 3
prev:
  title: "gRPC服务层"
  url: "02-grpc-service.html"
next:
  title: "规则系统"
  url: "04-rule-system.html"
---

## 1. 概述

模型推理系统基于 ONNX Runtime，支持：

- 多模型管理和动态选择
- LSTM 状态跨帧持久化
- 特征提取和动作编解码
- 分层模型选择策略

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    ModelManager (单例)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  ModelSelector  │    │  ModelContext   │                     │
│  │  (模型选择策略)  │    │  (线程本地上下文) │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    PredictModel (推理封装)                    ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       ││
│  │  │FeatureManager│  │ ONNXPredictor│  │ActionTranslator│     ││
│  │  │  (特征提取)   │  │  (ONNX推理)  │  │  (动作编解码)  │      ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ONNXEngine                                  │
│              (ONNX Runtime C++ API 封装)                         │
└─────────────────────────────────────────────────────────────────┘
```

## 3. ModelSelector 模型选择策略

### 3.1 分层选择结构

```
ModelSelector
    │
    ├─ map_id=1001 ─► ModelStyleSelector
    │                   │
    │                   ├─ style=BATTLE ─► ModelSelectorUnit
    │                   │                    • context: "battle_4v4"
    │                   │                    • model_id: 1
    │                   │
    │                   ├─ style=NAVIGATION ─► ModelSelectorUnit
    │                   │                       • context: "battle_4v4"
    │                   │                       • model_id: 0
    │                   │
    │                   └─ style=HUNTING ─► ModelSelectorUnit
    │                                        • context: "battle_4v4"
    │                                        • model_id: 5
    │
    └─ map_id=1002 ─► ModelStyleSelector
                        └─ ...
```

### 3.2 配置示例

```
selectors:
  - map_id: 1001
    styles:
      - { name: "navi_fly", context: "battle_4v4", mode_id: 2 }
      - { name: "battle", context: "battle_4v4", mode_id: 1 }
      - { name: "hunting", context: "battle_4v4", mode_id: 5 }
      - { name: "flee", context: "battle_4v4", mode_id: 5 }
      - { name: "navi_danger", context: "battle_4v4", mode_id: 11 }
```

## 4. 完整推理流程

```
void PredictModel::Predict(const std::shared_ptr<BaseContext>& context) {
  // ====== 阶段 1: 特征提取 ======
  std::vector<float> features;
  if (!feature_manager_->getFeatures(context.get(), features)) {
    LOG_ERROR("get features failed");
    return;
  }

  // ====== 阶段 2: 填充输入张量 ======
  for (size_t i = 0; i < features.size(); ++i) {
    feature_input_->Set(i, features[i]);
  }

  // 填充历史 LSTM 状态（非首帧）
  if (!context->FirstFrame()) {
    FillHistoryInput(context);
  }

  // ====== 阶段 3: ONNX 模型推理 ======
  std::vector<Ort::Value> result;
  predictor_->Predict(input_ops_, &result);

  // ====== 阶段 4: 计算合法动作掩码 ======
  std::vector<std::vector<int>> legal_action_list;
  action_translator_->Encode(context.get(),
                              model_descriptor_->LegalActionShape(),
                              legal_action_list);

  // ====== 阶段 5: 解析动作 ======
  std::vector<int> action_list(model_descriptor_->LegalActionShape().size());
  ParseActions(context, result, legal_action_list, action_list);

  // ====== 阶段 6: 动作解码 ======
  action_translator_->Decode(context.get(), action_list);
  context->RecordLabels(action_list);

  // 应用规则系统
  RuleManager::GetInstance()->MatchRules(RuleType::kActionDecode, context.get());

  // ====== 阶段 7: 保存 LSTM 状态 ======
  SaveLSTMData(context, result);
}
```

## 5. LSTM 状态管理

### 5.1 状态生命周期

```
帧 1：
  初始化: cell_state = [0,0,...], hidden_state = [0,0,...]
  推理: feature + zeros → ONNX → 输出 + cell/hidden
  保存: SaveLSTMData 保存输出的 cell 和 hidden

帧 2-N：
  恢复: FillHistoryInput 从 context 恢复上一帧的 state
  推理: feature + cell + hidden → ONNX → 输出 + 新的 cell/hidden
  保存: SaveLSTMData 保存新的 cell 和 hidden
```

### 5.2 状态恢复

```
void PredictModel::FillHistoryInput(const std::shared_ptr<BaseContext>& context) {
  // 检查 NaN 值
  bool nan = false;
  for (size_t i = 0; i < context->GetHistoryData()->m_hiddenState.size(); ++i) {
    if (context->GetHistoryData()->m_hiddenState[i] < -1e10 ||
        context->GetHistoryData()->m_hiddenState[i] > 1e10) {
      nan = true;
      break;
    }
  }

  if (!nan) {
    // 恢复 cell state
    for (size_t i = 0; i < context->GetHistoryData()->m_cellState.size(); ++i) {
      lstm_cell_input_->Set(0, i, context->GetHistoryData()->m_cellState[i]);
    }
    // 恢复 hidden state
    for (size_t i = 0; i < context->GetHistoryData()->m_hiddenState.size(); ++i) {
      lstm_hidden_input_->Set(0, i, context->GetHistoryData()->m_hiddenState[i]);
    }
  }
}
```

## 6. 动作概率处理

```
void PredictModel::ParseActions(...) {
  // 1. 提取 ONNX 输出为概率矩阵
  std::vector<std::vector<float>> probs(legal_action_list.size());
  for (size_t i = 0; i < probs.size(); ++i) {
    const auto& tensor = result[i];
    const auto data = ONNXEngine::GetTensorData<float>(tensor);
    int count = ONNXEngine::GetTensorSize(tensor);
    probs[i].resize(count);
    for (int j = 0; j < count; ++j) {
      probs[i][j] = data[j];
    }
  }

  // 2. Softmax + 掩码处理
  for (size_t i = 0; i < probs.size(); ++i) {
    auto& prob = probs[i];
    const auto& mask = legal_action_list[i];

    // 找最大值（数值稳定）
    float max_prob = std::numeric_limits<float>::min();
    for (size_t j = 0; j < prob.size(); ++j) {
      if (mask[j] != 0 && prob[j] > max_prob) {
        max_prob = prob[j];
      }
    }

    // Softmax
    float sum = 0;
    for (size_t j = 0; j < prob.size(); ++j) {
      if (mask[j] == 0) {
        prob[j] = 0;  // 非法动作概率置 0
      } else {
        prob[j] = std::exp(std::min(20.f, std::max(-20.f, prob[j] - max_prob)));
        sum += prob[j];
      }
    }
    for (size_t j = 0; j < prob.size(); ++j) {
      prob[j] /= sum;
    }
  }

  // 3. 贪心选择
  for (size_t i = 0; i < probs.size(); ++i) {
    action_list[i] = TopLabelIndex(probs[i], legal_action_list[i]);
  }
}
```

## 7. ONNX Runtime 集成

```
class ONNXEngine {
 public:
  Status LoadModel(const std::string& model_file) {
    Ort::SessionOptions session_options;

    // 配置线程数
    session_options.SetIntraOpNumThreads(intra_op_num_threads_);
    session_options.SetInterOpNumThreads(inter_op_num_threads_);

    // 禁用 CPU 内存竞技场
    session_options.DisableCpuMemArena();

    // 创建 ONNX 会话
    session_ = std::make_unique<Ort::Session>(
        OrtEnv(), model_file.c_str(), session_options);

    return Status::kSucess;
  }

  Status Run(const std::vector<const char*>& input_node_names,
             const std::vector<Ort::Value>& input_tensors,
             const std::vector<const char*>& output_node_names,
             std::vector<Ort::Value>* output_tensors) {
    try {
      *output_tensors = session_->Run(
          Ort::RunOptions{nullptr},
          input_node_names.data(),
          input_tensors.data(),
          input_node_names.size(),
          output_node_names.data(),
          output_node_names.size());
    } catch (const std::exception& e) {
      LOG_ERROR("run session failed|error:", e.what());
      return Status::kRunSessionFailed;
    }
    return Status::kSucess;
  }
};
```

## 8. 模型配置示例

```
# model.yaml
feature_shape: [1, 1461]
lstm_cell_shape: [1, 512]
lstm_hidden_shape: [1, 512]
legal_action_shape: [7, 43, 17, 17]
action_name: "new_navigation"
output_names:
  - "player0_out/player0_fc1_label_0/player0_fc_label_0_result:0"
  - "player0_out/player0_fc1_label_1/player0_fc_label_1_result:0"
  - "player0_out/player0_fc1_label_2/player0_fc_label_2_result:0"
  - "player0_out/player0_fc1_label_3/player0_fc_label_3_result:0"
  - "player_all_end/player0_public_lstm/save_lstm_cell_state:0"
  - "player_all_end/player0_public_lstm/save_lstm_hidden_state:0"
```
