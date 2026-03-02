# 模型推理系统 (Model Inference System)

## 1. 概述

AIServer 的模型推理系统基于 ONNX Runtime，支持：
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

## 3. ModelManager 模型管理器

### 3.1 类结构

**文件位置**: `src/core/model/model_manager.h`

```cpp
class ModelManager {
  MAKE_SINGLETON(ModelManager);

 public:
  void Initialize();
  void InitializeModelContext();
  std::optional<std::shared_ptr<core::predict::Predictor>>
      GetPredictor(const std::string& group, int model_id);
  void Predict(const std::shared_ptr<e::BaseContext>& context);

 private:
  void InitializeModelRegisters();
  void InitializeModelSelectors();
  void InitializePredictModels();
  void LoadModels();

  static thread_local std::unique_ptr<ModelContext> model_context_;
  std::vector<std::shared_ptr<ModelGroup>> model_groups_;
  std::shared_ptr<ModelSelector> model_selector_;
  std::unordered_map<std::string,
                     std::unordered_map<int, std::shared_ptr<core::predict::Predictor>>>
      predictors_;
};
```

### 3.2 初始化流程

```cpp
void ModelManager::Initialize() {
  // 1. 注册模型（从配置加载）
  InitializeModelRegisters();

  // 2. 初始化模型选择器
  InitializeModelSelectors();

  // 3. 加载 ONNX 模型
  LoadModels();
}

void ModelManager::InitializeModelRegisters() {
  const auto& registers = ModelConfig::GetInstance()->Registers();

  for (const auto& reg : registers) {
    auto group = std::make_shared<ModelGroup>(reg.Context());

    for (int model_id : reg.ModelIds()) {
      // 构建模型描述符
      auto descriptor = std::make_shared<ModelDescriptor>();
      std::string model_path = fmt::format("{}/{}", reg.Path(), model_id);
      descriptor->SetID(model_id);
      descriptor->SetModelPath(model_path + "/model.onnx");
      descriptor->SetFeatureConfig(model_path + "/feature.yaml");

      // 加载模型配置
      LoadModelOptions(model_path + "/model.yaml", descriptor);

      group->AddModel(descriptor);
    }

    model_groups_.push_back(group);
  }
}

void ModelManager::LoadModels() {
  for (const auto& group : model_groups_) {
    for (const auto& model : group->Models()) {
      auto predictor = std::make_shared<core::predict::ONNXPredictor>();
      predictor->Initialize(model->ModelPath(), model->OutputNames());
      predictors_[group->Name()][model->ID()] = std::move(predictor);
    }
  }
}
```

### 3.3 推理入口

```cpp
void ModelManager::Predict(const std::shared_ptr<e::BaseContext>& context) {
  // 1. 通过选择器获取对应的模型
  auto model = model_context_->GetModel(context, model_selector_);

  // 2. 执行推理
  model->Predict(context);
}
```

## 4. ModelSelector 模型选择策略

### 4.1 分层选择结构

```
ModelSelector
    │
    ├─ map_id=111 ─► ModelStyleSelector
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
    └─ map_id=112 ─► ModelStyleSelector
                        │
                        └─ ...
```

### 4.2 选择流程

```cpp
std::shared_ptr<PredictModel> ModelContext::GetModel(
    const std::shared_ptr<e::BaseContext>& context,
    const std::shared_ptr<ModelSelector>& model_selector) {

  // 1. 按地图 ID 获取 StyleSelector
  auto selector = model_selector->GetSelector(context->GetMapID(true));

  // 2. 按游戏风格获取 SelectorUnit
  auto style_unit = selector->GetUnit(context->GetModelStyle());

  // 3. 验证 context_type 匹配
  if (style_unit->ContextType() != context->GetContextType()) {
    return models_[context_type][0];  // 默认模型
  }

  // 4. 返回对应模型
  return models_[context_type][style_unit->ModelID()];
}
```

### 4.3 配置示例

```yaml
selectors:
  - map_id: 111
    styles:
      - { name: "navi_fly", context: "battle_4v4", mode_id: 2 }
      - { name: "battle", context: "battle_4v4", mode_id: 1 }
      - { name: "hunting", context: "battle_4v4", mode_id: 5 }
      - { name: "flee", context: "battle_4v4", mode_id: 5 }
      - { name: "navi_danger", context: "battle_4v4", mode_id: 11 }
      - { name: "battle_circle", context: "battle_4v4", mode_id: 12 }
```

## 5. PredictModel 推理封装

### 5.1 类结构

**文件位置**: `src/core/model/predict_model.h`

```cpp
class PredictModel {
 public:
  bool Initialize();
  void Predict(const std::shared_ptr<e::BaseContext>& context);

 private:
  void FillHistoryInput(const std::shared_ptr<e::BaseContext>& context);
  void ParseActions(const std::shared_ptr<e::BaseContext>& context,
                    const std::vector<Ort::Value>& result,
                    const std::vector<std::vector<int>>& legal_action_list,
                    std::vector<int>& action_list);
  int TopLabelIndex(const std::vector<float>& probs,
                    const std::vector<int>& mask) const;
  void SaveLSTMData(const std::shared_ptr<e::BaseContext>& context,
                    const std::vector<Ort::Value>& result) const;

  std::string group_;
  std::shared_ptr<ModelDescriptor> model_descriptor_;
  core::predict::InputTensor<float>* feature_input_;
  core::predict::InputTensor<float>* lstm_cell_input_;
  core::predict::InputTensor<float>* lstm_hidden_input_;
  std::map<std::string, core::predict::InputTensor<float>> input_ops_;
  std::shared_ptr<core::predict::Predictor> predictor_;
  std::unique_ptr<e::ActionBase> action_translator_;
  std::unique_ptr<e::FeatureManager> feature_manager_;
};
```

### 5.2 初始化

```cpp
bool PredictModel::Initialize() {
  // 1. 创建动作编码器
  action_translator_ = std::unique_ptr<e::ActionBase>(
      CREATE_CLASS_INSTANCE(model_descriptor_->ActionName(), e::ActionBase));

  // 2. 初始化特征管理器
  feature_manager_ = std::make_unique<e::FeatureManager>();
  feature_manager_->Init(model_descriptor_->FeatureConfig());

  // 3. 获取 ONNX 预测器
  predictor_ = ModelManager::GetInstance()->GetPredictor(
      group_, model_descriptor_->ID());

  // 4. 初始化输入张量
  feature_input_ = &input_ops_["feature_vec:0"];
  lstm_cell_input_ = &input_ops_["cell_state:0"];
  lstm_hidden_input_ = &input_ops_["hidden_state:0"];

  // 5. 创建零初始化张量
  feature_input_->Zeros(
      model_descriptor_->FeatureShape().data(),
      model_descriptor_->FeatureShape().size());
  lstm_cell_input_->Zeros(
      model_descriptor_->LSTMCellShape().data(),
      model_descriptor_->LSTMCellShape().size());
  lstm_hidden_input_->Zeros(
      model_descriptor_->LSTMHiddenShape().data(),
      model_descriptor_->LSTMHiddenShape().size());

  return true;
}
```

### 5.3 完整推理流程

```cpp
void PredictModel::Predict(const std::shared_ptr<e::BaseContext>& context) {
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
  if (!context->MatchPreNoDecode()) {
    core::rule::RuleManager::GetInstance()->MatchRules(
        core::rule::RuleType::kActionDecode, context.get());
  }

  // ====== 阶段 7: 保存 LSTM 状态 ======
  SaveLSTMData(context, result);
}
```

## 6. ONNX Runtime 集成

### 6.1 ONNXEngine 类

**文件位置**: `src/core/predict/onnx_engine.h`

```cpp
class ONNXEngine {
 public:
  enum class Status : uint8_t {
    kSucess = 0,
    kSessionCreateFailed = 1,
    kModelLoadFailed = 2,
    kRunSessionFailed = 3,
  };

  ONNXEngine(int intra_op_num_threads = 1, int inter_op_num_threads = 1);

  Status LoadModel(const std::string& model_file);
  Status Run(const std::vector<const char*>& input_node_names,
             const std::vector<Ort::Value>& input_tensors,
             const std::vector<const char*>& output_node_names,
             std::vector<Ort::Value>* output_tensors);

  static Ort::Value CreateTensor(ONNXTensorElementDataType type,
                                 const int64_t* shape, size_t shape_len);
  template <typename T>
  static const T* GetTensorData(const Ort::Value& value);
  static int GetTensorSize(const Ort::Value& value);

 private:
  std::unique_ptr<Ort::Session> session_;
  int intra_op_num_threads_;
  int inter_op_num_threads_;
};
```

### 6.2 模型加载

```cpp
ONNXEngine::Status ONNXEngine::LoadModel(const std::string& model_file) {
  Ort::SessionOptions session_options;

  // 配置线程数
  session_options.SetIntraOpNumThreads(intra_op_num_threads_);
  session_options.SetInterOpNumThreads(inter_op_num_threads_);

  // 禁用 CPU 内存竞技场
  session_options.DisableCpuMemArena();

  // 创建 ONNX 会话
  session_ = std::make_unique<Ort::Session>(
      OrtEnv(),
      model_file.c_str(),
      session_options);

  return Status::kSucess;
}
```

### 6.3 推理执行

```cpp
ONNXEngine::Status ONNXEngine::Run(
    const std::vector<const char*>& input_node_names,
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
```

## 7. LSTM 状态管理

### 7.1 状态存储结构

```cpp
// 在 HistoryData 中
struct HistoryData {
  std::vector<float> m_cellState;    // LSTM cell state
  std::vector<float> m_hiddenState;  // LSTM hidden state
};
```

### 7.2 状态恢复

```cpp
void PredictModel::FillHistoryInput(const std::shared_ptr<e::BaseContext>& context) {
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

### 7.3 状态保存

```cpp
void PredictModel::SaveLSTMData(const std::shared_ptr<e::BaseContext>& context,
                                const std::vector<Ort::Value>& result) const {
  if (result.size() <= 2) return;

  // ONNX 输出：[action_0, action_1, ..., cell_state, hidden_state]
  const auto& cell_tensor = result[result.size() - 2];
  int cell_num = ONNXEngine::GetTensorSize(cell_tensor);
  const auto cell_state = ONNXEngine::GetTensorData<float>(cell_tensor);
  context->GetHistoryData()->m_cellState.resize(cell_num);
  for (int i = 0; i < cell_num; ++i) {
    context->GetHistoryData()->m_cellState[i] = cell_state[i];
  }

  const auto& hidden_tensor = result[result.size() - 1];
  int hidden_num = ONNXEngine::GetTensorSize(hidden_tensor);
  const auto hidden_state = ONNXEngine::GetTensorData<float>(hidden_tensor);
  context->GetHistoryData()->m_hiddenState.resize(hidden_num);
  for (int i = 0; i < hidden_num; ++i) {
    context->GetHistoryData()->m_hiddenState[i] = hidden_state[i];
  }
}
```

### 7.4 LSTM 状态生命周期

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

## 8. 动作概率处理

### 8.1 ParseActions

```cpp
void PredictModel::ParseActions(
    const std::shared_ptr<e::BaseContext>& context,
    const std::vector<Ort::Value>& result,
    const std::vector<std::vector<int>>& legal_action_list,
    std::vector<int>& action_list) {

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

  // 3. 记录概率
  context->RecordProbs(probs);

  // 4. 贪心选择
  for (size_t i = 0; i < probs.size(); ++i) {
    action_list[i] = TopLabelIndex(probs[i], legal_action_list[i]);
  }
}
```

## 9. InputTensor 张量管理

**文件位置**: `src/core/predict/input_tensor.h`

```cpp
template <typename DataType>
class InputTensor {
 public:
  void Zeros(const int32_t* shape, int32_t shape_dim) {
    tensor_shape_dim_ = shape_dim;
    tensor_shape_ = new int64_t[tensor_shape_dim_];
    tensor_data_len_ = 1;
    for (int i = 0; i < shape_dim; ++i) {
      tensor_shape_[i] = shape[i];
      tensor_data_len_ *= tensor_shape_[i];
    }
    tensor_ = ONNXEngine::CreateTensor(
        onnx_type_map[typeid(DataType).name()],
        tensor_shape_, tensor_shape_dim_);
    tensor_data_ = const_cast<DataType*>(
        ONNXEngine::GetTensorData<DataType>(tensor_));
    memset(tensor_data_, 0, tensor_data_len_ * sizeof(DataType));
  }

  // 多维访问
  DataType Get(int x, int y) const;
  void Set(int x, int y, DataType v);
  void Set(int x, DataType v);

  int TensorDataSize() const { return tensor_data_len_; }
  Ort::Value& Tensor() { return tensor_; }

 private:
  int64_t* tensor_shape_;
  int tensor_shape_dim_;
  DataType* tensor_data_;
  int tensor_data_len_;
  Ort::Value tensor_;
};
```

## 10. ModelDescriptor 模型描述符

```cpp
class ModelDescriptor {
 public:
  int ID() const { return id_; }
  std::string FeatureConfig() const { return feature_config_; }
  std::string ModelPath() const { return model_path_; }
  std::string ActionName() const { return action_name_; }
  std::vector<int> FeatureShape() const { return feature_shape_; }
  std::vector<int> LSTMCellShape() const { return lstm_cell_shape_; }
  std::vector<int> LSTMHiddenShape() const { return lstm_hidden_shape_; }
  std::vector<int> LegalActionShape() const { return legal_action_shape_; }
  std::vector<std::string> OutputNames() const { return output_names_; }
};
```

### model.yaml 配置示例

```yaml
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

## 11. 完整推理流程图

```
gRPC Request (ActionRequest)
        │
        ▼
ModelManager::Predict(context)
        │
        ▼
ModelContext::GetModel(context, selector)
        │
        ├─ 获取 map_id → SelectorConfig
        ├─ 获取 ModelStyle → ModelSelectorUnit
        └─ 返回 PredictModel 实例
        │
        ▼
PredictModel::Predict(context)
        │
        ├─ [1] FeatureManager::getFeatures()
        │       └─ 提取 1461 维特征向量
        │
        ├─ [2] FillHistoryInput() [非首帧]
        │       └─ 恢复 LSTM(cell_state, hidden_state)
        │
        ├─ [3] ONNXPredictor::Predict()
        │       ├─ 准备输入张量
        │       │   ├─ feature_vec:0 [1, 1461]
        │       │   ├─ cell_state:0 [1, 512]
        │       │   └─ hidden_state:0 [1, 512]
        │       │
        │       ├─ ONNXEngine::Run()
        │       │
        │       └─ 获取 7 个输出张量
        │           ├─ action_0_logits [1, 43]
        │           ├─ action_1_logits [1, 43]
        │           ├─ action_2_logits [1, 17]
        │           ├─ action_3_logits [1, 17]
        │           ├─ action_4_logits [1, 43]
        │           ├─ cell_state_out [1, 512]
        │           └─ hidden_state_out [1, 512]
        │
        ├─ [4] ActionBase::Encode()
        │       ├─ EncodeMainMask() → mask[0]
        │       ├─ EncodeYawMask() → mask[1]
        │       ├─ EncodePitchMask() → mask[2]
        │       ├─ EncodeMoveMask() → mask[3]
        │       └─ EncodeSkillMask() → mask[4]
        │
        ├─ [5] ParseActions()
        │       ├─ 提取 ONNX 输出
        │       ├─ 应用掩码：prob[i] *= mask[i]
        │       ├─ Softmax 归一化
        │       └─ action_list[i] = argmax(prob[i])
        │
        ├─ [6] ActionBase::Decode()
        │       ├─ DecodeMainLabel()
        │       ├─ DecodeYawLabel()
        │       ├─ DecodePitchLabel()
        │       └─ DecodeMoveLabel()
        │
        ├─ [7] RuleManager::MatchRules(kActionDecode)
        │
        └─ [8] SaveLSTMData()
                ├─ context->m_cellState = cell_state_out
                └─ context->m_hiddenState = hidden_state_out
```

## 12. 扩展点

### 12.1 添加新模型

1. 创建模型目录 `config/model/new_model/0/`
2. 放置 `model.onnx`、`model.yaml`、`feature.yaml`
3. 在 `ai_server.yaml` 的 `model.registers` 中添加配置
4. 在 `model.selectors` 中添加选择规则

### 12.2 添加新动作类型

1. 创建 `src/core/actions/action_new.h`
2. 继承 `ActionBase`，实现 `EncodeActions()` 和 `Decode()`
3. 使用 `REGISTER_CLASS` 宏注册
4. 在 `model.yaml` 中设置 `action_name`
