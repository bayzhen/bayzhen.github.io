# 特征提取系统设计文档

## 概述

特征提取系统负责将游戏状态转换为神经网络可以处理的浮点数向量。`FeatureManager` 协调多个特征提取器，根据配置文件动态组织特征维度，支持归一化处理和动态复制因子。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        FeatureManager                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  m_featureMap                            │   │
│  │  vector<pair<string, FeatureBase*>>                      │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ "state"    → StateFeature                        │   │   │
│  │  │ "enemy"    → EnemyFeature                        │   │   │
│  │  │ "weapon"   → WeaponFeature                       │   │   │
│  │  │ "skill"    → SkillFeature                        │   │   │
│  │  │ "depth"    → DepthFeature                        │   │   │
│  │  │ ...        → ...                                 │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                m_featureConfigs                          │   │
│  │  vector<pair<string, vector<FeatureCell>>>               │   │
│  │  定义每类特征的子特征及其归一化参数                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  featureDim_s                            │   │
│  │  vector<pair<string, int>>                               │   │
│  │  记录每类特征的输出维度                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 提取特征
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BaseContext                               │
│                    (游戏状态数据源)                               │
└─────────────────────────────────────────────────────────────────┘
```

## 核心类设计

### FeatureManager

```cpp
// src/core/features/feature_manager.h:14-31
class FeatureManager {
 public:
  FeatureManager() = default;
  virtual ~FeatureManager() = default;

  // 初始化，加载配置文件
  bool Init(const std::string& config);

  // 提取特征向量
  bool getFeatures(BaseContext* context, std::vector<float>& feature);

  // 获取总特征维度
  int totalFeatureSize() { return featureSize_; }

 private:
  // 特征提取器映射 (名称 → 提取器实例)
  std::vector<std::pair<std::string, FeatureBase*>> m_featureMap;

  // 特征配置 (名称 → 子特征列表)
  std::vector<std::pair<std::string, std::vector<FeatureCell>>> m_featureConfigs;

  // 每类特征的维度记录
  std::vector<std::pair<std::string, int>> featureDim_s;

  // 总特征维度
  int featureSize_;
};
```

### FeatureBase 基类

```cpp
// src/core/features/feature_base.h:26-51
class FeatureBase {
  MAKE_NON_COPYABLE(FeatureBase);

 public:
  FeatureBase() {
    AddFunc("padding", &FeatureBase::Padding);
  };
  virtual ~FeatureBase() = default;

  // 初始化，接收配置参数
  virtual void Init(std::map<std::string, std::string> params) = 0;

  // 提取特征
  virtual bool ExtractFeatures(BaseContext* context,
                               std::vector<float>& features,
                               const std::vector<FeatureCell>& cell) = 0;

  // 设置特征维度
  void SetFeatureDim(int dim) { featureDim_ = dim; }

  // 填充零值
  void Padding(BaseContext* ctx, std::vector<float>& fs, const FeatureCell& cell) {
    fs.resize(fs.size() + cell.size_, 0);
  }

  // 函数指针类型
  using Func = void (FeatureBase::*)(BaseContext* context,
                                     std::vector<float>& features,
                                     const FeatureCell& cell);

  // 添加子特征提取函数
  void AddFunc(std::string name, Func func) { funcMap_[name] = func; }

 protected:
  std::map<std::string, Func> funcMap_;
  int featureDim_ = 0;
};

// 注册子特征函数的宏
#define REGISTER_FEATURE_FUNC(name, func) \
  AddFunc(name, static_cast<Func>(func));
```

### FeatureCell 配置单元

```cpp
// src/core/features/feature_base.h:15-24
class FeatureCell {
 public:
  FeatureCell() = default;
  FeatureCell(std::string name, size_t size, float norm)
      : name_(name), size_(size), norm_(norm) {}

 public:
  std::string name_;    // 子特征名称
  size_t size_ = 0;     // 特征维度
  float norm_ = 1;      // 归一化系数
};
```

## 特征提取流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      getFeatures()                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│     遍历 m_featureMap 中的所有特征提取器                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ StateFeature  │     │ EnemyFeature  │     │ DepthFeature  │
│ Extract()     │     │ Extract()     │     │ Extract()     │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              遍历对应的 FeatureCell 配置                          │
│              调用注册的子特征函数                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    应用归一化 (/ norm_)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               追加到输出向量 features                             │
└─────────────────────────────────────────────────────────────────┘
```

## 特征提取器类型

### 已实现的特征提取器

| 提取器 | 类名 | 说明 |
|-------|------|------|
| 状态特征 | StateFeature | 代理基础状态 (位置、血量、护盾等) |
| 敌人特征 | EnemyFeature | 敌人信息 (位置、距离、状态) |
| 队友特征 | AllyFeature | 队友信息 |
| 武器特征 | WeaponFeature | 武器状态 (弹药、类型等) |
| 技能特征 | SkillFeature | 技能状态 (CD、就绪状态) |
| 深度特征 | DepthFeature | 深度图数据 |
| 射线特征 | LineTraceFeature | 射线追踪结果 |
| 声音特征 | SoundFeature | 声音感知数据 |
| 补给特征 | SupplyFeature | 补给点状态 |
| 模式特征 | ModeFeature | 游戏模式特定数据 |
| 历史特征 | HistoryFeature | 历史状态信息 |
| 目标特征 | TargetFeature | 目标信息 |

### 特征提取器实现示例

```cpp
// 状态特征提取器
class StateFeature : public FeatureBase {
 public:
  StateFeature() {
    // 注册子特征函数
    REGISTER_FEATURE_FUNC("position", &StateFeature::ExtractPosition);
    REGISTER_FEATURE_FUNC("rotation", &StateFeature::ExtractRotation);
    REGISTER_FEATURE_FUNC("health", &StateFeature::ExtractHealth);
    REGISTER_FEATURE_FUNC("shield", &StateFeature::ExtractShield);
    REGISTER_FEATURE_FUNC("velocity", &StateFeature::ExtractVelocity);
    REGISTER_FEATURE_FUNC("movement_state", &StateFeature::ExtractMovementState);
  }

  void Init(std::map<std::string, std::string> params) override {
    // 初始化参数
  }

  bool ExtractFeatures(BaseContext* context,
                       std::vector<float>& features,
                       const std::vector<FeatureCell>& cells) override {
    for (const auto& cell : cells) {
      auto it = funcMap_.find(cell.name_);
      if (it != funcMap_.end()) {
        (this->*(it->second))(context, features, cell);
      }
    }
    return true;
  }

 private:
  void ExtractPosition(BaseContext* ctx, std::vector<float>& fs,
                       const FeatureCell& cell) {
    const auto& pos = ctx->BotState().m_state.m_position;
    fs.push_back(pos.x / cell.norm_);
    fs.push_back(pos.y / cell.norm_);
    fs.push_back(pos.z / cell.norm_);
  }

  void ExtractHealth(BaseContext* ctx, std::vector<float>& fs,
                     const FeatureCell& cell) {
    float hp = ctx->BotState().m_state.m_health;
    fs.push_back(hp / cell.norm_);
  }

  void ExtractShield(BaseContext* ctx, std::vector<float>& fs,
                     const FeatureCell& cell) {
    float shield = ctx->BotState().m_state.m_shield;
    fs.push_back(shield / cell.norm_);
  }

  // ... 更多子特征提取
};

// 工厂注册
REGISTER_CLASS(FeatureBase, StateFeature, "state");
```

### 敌人特征提取器

```cpp
class EnemyFeature : public FeatureBase {
 public:
  EnemyFeature() {
    REGISTER_FEATURE_FUNC("enemy_pos", &EnemyFeature::ExtractEnemyPosition);
    REGISTER_FEATURE_FUNC("enemy_dist", &EnemyFeature::ExtractEnemyDistance);
    REGISTER_FEATURE_FUNC("enemy_state", &EnemyFeature::ExtractEnemyState);
    REGISTER_FEATURE_FUNC("enemy_visible", &EnemyFeature::ExtractEnemyVisible);
  }

  bool ExtractFeatures(BaseContext* context,
                       std::vector<float>& features,
                       const std::vector<FeatureCell>& cells) override {
    const auto& enemies = context->getEnemies();

    for (const auto& cell : cells) {
      // 处理动态复制因子
      int replicateFactor = cell.size_ / BASE_ENEMY_DIM;

      for (int i = 0; i < replicateFactor; ++i) {
        if (i < enemies.size()) {
          ExtractSingleEnemy(context, features, enemies[i], cell);
        } else {
          // 填充零值
          Padding(context, features, cell);
        }
      }
    }
    return true;
  }

 private:
  static constexpr int BASE_ENEMY_DIM = 7;  // 每个敌人的基础维度

  void ExtractSingleEnemy(BaseContext* ctx, std::vector<float>& fs,
                          const std::pair<float, const g::NearbyPlayer*>& enemy,
                          const FeatureCell& cell) {
    const auto* player = enemy.second;
    // 距离
    fs.push_back(enemy.first / cell.norm_);
    // 位置
    fs.push_back(player->m_state.m_position.x / cell.norm_);
    fs.push_back(player->m_state.m_position.y / cell.norm_);
    fs.push_back(player->m_state.m_position.z / cell.norm_);
    // 血量
    fs.push_back(player->m_state.m_health / 100.0f);
    // 状态
    fs.push_back(static_cast<float>(player->m_state.m_aliveState));
    // 可见性
    fs.push_back(player->m_state.m_isVisible ? 1.0f : 0.0f);
  }
};
```

## 配置系统

### 特征配置文件

```yaml
# config/feature_config.yaml
features:
  - name: state
    class: StateFeature
    params:
      max_enemies: 5
    cells:
      - name: position
        size: 3
        norm: 10000.0
      - name: rotation
        size: 2
        norm: 180.0
      - name: health
        size: 1
        norm: 100.0
      - name: shield
        size: 1
        norm: 100.0
      - name: velocity
        size: 3
        norm: 1000.0

  - name: enemy
    class: EnemyFeature
    params:
      max_enemies: 5
    cells:
      - name: enemy_info
        size: 35   # 5 enemies * 7 features
        norm: 10000.0

  - name: weapon
    class: WeaponFeature
    cells:
      - name: current_weapon
        size: 10
        norm: 1.0
      - name: ammo
        size: 2
        norm: 100.0

  - name: skill
    class: SkillFeature
    cells:
      - name: q_skill
        size: 5
        norm: 1.0
      - name: c_skill
        size: 5
        norm: 1.0
      - name: x_skill
        size: 5
        norm: 1.0

  - name: depth
    class: DepthFeature
    cells:
      - name: depth_map
        size: 256   # 16x16 深度图
        norm: 1000.0

  - name: padding
    class: PaddingFeature
    cells:
      - name: padding
        size: 64
        norm: 1.0
```

### 配置加载

```cpp
bool FeatureManager::Init(const std::string& config) {
  YAML::Node root = YAML::LoadFile(config);
  const auto& features = root["features"];

  featureSize_ = 0;

  for (const auto& feature : features) {
    std::string name = feature["name"].as<std::string>();
    std::string className = feature["class"].as<std::string>();

    // 创建特征提取器
    FeatureBase* extractor = ClassFactory<FeatureBase>::Create(className);
    if (!extractor) {
      LOG_ERROR("Failed to create feature extractor: {}", className);
      continue;
    }

    // 初始化参数
    std::map<std::string, std::string> params;
    if (feature["params"]) {
      for (auto it = feature["params"].begin();
           it != feature["params"].end(); ++it) {
        params[it->first.as<std::string>()] = it->second.as<std::string>();
      }
    }
    extractor->Init(params);

    // 解析子特征配置
    std::vector<FeatureCell> cells;
    int featureDim = 0;
    for (const auto& cell : feature["cells"]) {
      FeatureCell fc;
      fc.name_ = cell["name"].as<std::string>();
      fc.size_ = cell["size"].as<size_t>();
      fc.norm_ = cell["norm"].as<float>();
      cells.push_back(fc);
      featureDim += fc.size_;
    }

    extractor->SetFeatureDim(featureDim);
    m_featureMap.push_back({name, extractor});
    m_featureConfigs.push_back({name, cells});
    featureDim_s.push_back({name, featureDim});
    featureSize_ += featureDim;
  }

  LOG_INFO("FeatureManager initialized with {} features, total dim: {}",
           m_featureMap.size(), featureSize_);
  return true;
}
```

## 动态复制因子

### 原理

对于可变数量的实体 (如敌人、队友)，使用动态复制因子来固定特征维度：

```
配置: enemy_info, size=35, norm=10000.0
基础维度: 7 (每个敌人)
复制因子: 35 / 7 = 5

实际敌人数 = 3:
  Enemy[0] → [f0, f1, f2, f3, f4, f5, f6]
  Enemy[1] → [f7, f8, f9, f10, f11, f12, f13]
  Enemy[2] → [f14, f15, f16, f17, f18, f19, f20]
  Padding  → [0, 0, 0, 0, 0, 0, 0]
  Padding  → [0, 0, 0, 0, 0, 0, 0]

输出维度始终为 35
```

### 实现

```cpp
bool EnemyFeature::ExtractFeatures(BaseContext* context,
                                   std::vector<float>& features,
                                   const std::vector<FeatureCell>& cells) {
  const auto& enemies = context->getEnemies();

  for (const auto& cell : cells) {
    // 计算复制因子
    int replicateFactor = cell.size_ / BASE_ENEMY_DIM;

    for (int i = 0; i < replicateFactor; ++i) {
      if (i < static_cast<int>(enemies.size())) {
        // 提取真实敌人特征
        ExtractSingleEnemy(context, features, enemies[i], cell);
      } else {
        // 填充零值
        for (int j = 0; j < BASE_ENEMY_DIM; ++j) {
          features.push_back(0.0f);
        }
      }
    }
  }
  return true;
}
```

## 归一化处理

### 归一化策略

```cpp
// 位置归一化 (除以地图尺度)
void ExtractPosition(BaseContext* ctx, std::vector<float>& fs,
                     const FeatureCell& cell) {
  const auto& pos = ctx->BotState().m_state.m_position;
  fs.push_back(pos.x / cell.norm_);  // norm_ = 10000.0
  fs.push_back(pos.y / cell.norm_);
  fs.push_back(pos.z / cell.norm_);
}

// 角度归一化 (除以180度)
void ExtractRotation(BaseContext* ctx, std::vector<float>& fs,
                     const FeatureCell& cell) {
  float yaw = ctx->BotState().m_state.m_rotation.yaw;
  float pitch = ctx->BotState().m_state.m_rotation.pitch;
  fs.push_back(yaw / cell.norm_);    // norm_ = 180.0
  fs.push_back(pitch / cell.norm_);
}

// 百分比归一化 (0-1范围)
void ExtractHealth(BaseContext* ctx, std::vector<float>& fs,
                   const FeatureCell& cell) {
  float hp = ctx->BotState().m_state.m_health;
  fs.push_back(hp / cell.norm_);     // norm_ = 100.0
}
```

## 与模型系统的交互

### 特征传递流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      PredictExecutor                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FeatureManager::getFeatures(context, features)                  │
│  输出: vector<float> features (size = totalFeatureSize_)         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PredictModel::Predict(features, outputs)                        │
│  输入: features                                                  │
│  输出: outputs (动作向量)                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 特征维度验证

```cpp
// 在模型加载时验证
bool PredictModel::Load(const std::string& modelPath,
                        FeatureManager* featureManager) {
  // 获取模型期望的输入维度
  auto inputShape = session_->GetInputShape(0);
  int expectedDim = inputShape[1];

  // 获取实际特征维度
  int actualDim = featureManager->totalFeatureSize();

  if (expectedDim != actualDim) {
    LOG_ERROR("Feature dimension mismatch: expected {}, got {}",
              expectedDim, actualDim);
    return false;
  }

  return true;
}
```

## 扩展点

### 添加新特征提取器

1. **创建特征类**
```cpp
// src/core/features/new_feature.h
class NewFeature : public FeatureBase {
 public:
  NewFeature() {
    REGISTER_FEATURE_FUNC("sub_feature_1", &NewFeature::ExtractSubFeature1);
    REGISTER_FEATURE_FUNC("sub_feature_2", &NewFeature::ExtractSubFeature2);
  }

  void Init(std::map<std::string, std::string> params) override {
    // 读取初始化参数
    if (params.count("param1")) {
      param1_ = std::stoi(params["param1"]);
    }
  }

  bool ExtractFeatures(BaseContext* context,
                       std::vector<float>& features,
                       const std::vector<FeatureCell>& cells) override {
    for (const auto& cell : cells) {
      auto it = funcMap_.find(cell.name_);
      if (it != funcMap_.end()) {
        (this->*(it->second))(context, features, cell);
      }
    }
    return true;
  }

 private:
  void ExtractSubFeature1(BaseContext* ctx, std::vector<float>& fs,
                          const FeatureCell& cell) {
    // 实现子特征提取
  }

  void ExtractSubFeature2(BaseContext* ctx, std::vector<float>& fs,
                          const FeatureCell& cell) {
    // 实现子特征提取
  }

  int param1_ = 0;
};

// 工厂注册
REGISTER_CLASS(FeatureBase, NewFeature, "new_feature");
```

2. **添加配置**
```yaml
# config/feature_config.yaml
features:
  # ... 现有特征
  - name: new_feature
    class: NewFeature
    params:
      param1: 10
    cells:
      - name: sub_feature_1
        size: 5
        norm: 1.0
      - name: sub_feature_2
        size: 3
        norm: 100.0
```

### 自定义归一化

```cpp
class CustomNormFeature : public FeatureBase {
 private:
  void ExtractWithCustomNorm(BaseContext* ctx, std::vector<float>& fs,
                             const FeatureCell& cell) {
    float value = GetRawValue(ctx);

    // 自定义归一化逻辑
    float normalized;
    if (value < 0) {
      normalized = -std::sqrt(-value) / cell.norm_;
    } else {
      normalized = std::sqrt(value) / cell.norm_;
    }

    fs.push_back(std::clamp(normalized, -1.0f, 1.0f));
  }
};
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/features/feature_manager.h` | FeatureManager 定义 |
| `src/core/features/feature_manager.cc` | FeatureManager 实现 |
| `src/core/features/feature_base.h` | FeatureBase 基类 |
| `src/core/features/*.h` | 各特征提取器实现 |
| `config/feature_config.yaml` | 特征配置文件 |
