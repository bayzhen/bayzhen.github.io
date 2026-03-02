---
layout: article
title: "配置系统"
description: "双缓冲机制、NACOS集成、热更新配置与静态配置管理"
level: intermediate
tags: ["配置", "热更新"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 1
prev:
  title: "架构概述"
  url: "00-architecture-overview.html"
next:
  title: "gRPC服务层"
  url: "02-grpc-service.html"
---

## 1. 概述

配置系统支持两种配置模式：

- **静态配置**：启动时从本地文件加载，不支持运行时更新
- **热更新配置**：从配置中心加载，支持运行时动态更新

核心特性：

- 双缓冲机制实现无锁读取
- 配置中心集成支持配置推送
- 宏驱动的自动注册

## 2. ConfigManager 设计

### 2.1 类结构

```
class ConfigManager {
  MAKE_SINGLETON(ConfigManager);

 public:
  using ReloadFunc = std::function<void(const YAML::Node&)>;

  struct ModuleConfig {
    std::string name_;      // 模块名（YAML 中的 key）
    ReloadFunc func_;       // 配置更新回调函数
  };

  // 初始化：连接配置中心、加载配置
  bool Initialize();

  // 注册热更新配置
  bool RegisterReloadableConfig(const std::string& file_name,
                                const std::string& module_name,
                                ReloadFunc func);

  // 注册静态配置
  bool RegisterStaticConfig(const std::string& file_name,
                            const std::string& module_name,
                            ReloadFunc func);

 private:
  // 按文件名组织的模块注册表
  std::unordered_map<std::string, std::vector<ModuleConfig>> reloadable_modules_by_file_;
  std::unordered_map<std::string, std::vector<ModuleConfig>> static_modules_by_file_;

  std::mutex update_mutex_;  // 更新互斥锁
};
```

### 2.2 单例模式实现

```
#define MAKE_SINGLETON(ClassName)                  \
 public:                                           \
  ClassName(const ClassName&) = delete;            \
  ClassName& operator=(const ClassName&) = delete; \
  ClassName(ClassName&&) = delete;                 \
  ClassName& operator=(ClassName&&) = delete;      \
                                                   \
 protected:                                        \
  ClassName() = default;                           \
  ~ClassName() = default;                          \
                                                   \
 public:                                           \
  static ClassName* GetInstance() {                \
    static ClassName instance;  // C++11 Magic Statics，线程安全 \
    return &instance                              \
  }
```

## 3. 静态配置 vs 热更新配置

| 特性 | 静态配置 | 热更新配置 |
| --- | --- | --- |
| 加载时机 | 启动时 | 启动时 + 运行时 |
| 数据源 | 本地文件 | 配置中心 |
| 更新方式 | 重启服务 | 配置推送 |
| 线程安全 | 无需特殊处理 | 双缓冲机制 |
| 典型用途 | 模型路径、OBJ 配置 | 日志级别、游戏参数 |

### 3.1 注册宏定义

```
// 注册热更新配置
#define REGISTER_RELOADABLE_CONFIG(file_name, module_name, ReloadFunc)        \
  static bool reloadable_config_##module_name =                               \
      ConfigManager::GetInstance()->RegisterReloadableConfig(                 \
          file_name, #module_name, [](const YAML::Node& node) { ReloadFunc(node); });

// 注册静态配置
#define REGISTER_STATIC_CONFIG(module_name, ReloadFunc)                       \
  static bool static_config_##module_name =                                   \
      ConfigManager::GetInstance()->RegisterStaticConfig(                     \
          kStaticConfigPath, #module_name,
          [](const YAML::Node& node) { ReloadFunc(node); });
```

### 3.2 使用示例

```
// 热更新配置
REGISTER_RELOADABLE_CONFIG("server.yaml", log, [](const YAML::Node& node) {
  // 1. 获取可写的配置对象
  auto& conf = LoggerConfig::Writable();

  // 2. 从 YAML 解析
  conf = node.as<LoggerConfig>();

  // 3. 切换为活跃配置
  LoggerConfig::SwitchActive();
});

// 静态配置
REGISTER_STATIC_CONFIG(model, [](const YAML::Node& config) {
  ModelConfig::GetInstance()->Initialize(config);
});
```

## 4. EnableDoubleStore 双缓冲机制

### 4.1 设计目标

- **无锁读取**：读线程不需要获取锁
- **原子切换**：写完成后瞬间切换
- **引用计数**：确保安全释放

### 4.2 类结构

```
template <typename TStore>
class EnableDoubleStore {
 public:
  // 获取可写的缓冲区（非活跃的那个）
  static TStore& Writable() { return double_.Writable(); }

  // 切换活跃缓冲区
  static void SwitchActive() { double_.SwitchActive(); }

  // 获取活跃缓冲区的共享指针
  static Shared Readable() { return double_.Readable(); }

 private:
  static DoubleStore<TStore> double_;
};
```

### 4.3 DoubleStore 实现

```
template <typename TStore>
class DoubleStore {
 public:
  // 获取可写缓冲区（自旋等待引用计数为 0）
  TStore& Writable() {
    size_t idx_spare = active_first_otherwise_second_ ? 1 : 0;

    while (stores_[idx_spare].refcnt_ > 0) {
      std::this_thread::sleep_for(1ms);  // 等待读者释放
    }

    stores_[idx_spare].store_ = TStore{};  // 清空
    return stores_[idx_spare].store_;
  }

  // 切换活跃缓冲区
  void SwitchActive() {
    active_first_otherwise_second_ = !active_first_otherwise_second_;
  }

  // 获取可读缓冲区（原子增加引用计数）
  Shared Readable() {
    size_t idx_active = 0;

    for (;;) {
      idx_active = active_first_otherwise_second_ ? 0 : 1;
      ++stores_[idx_active].refcnt_;  // 增加引用计数

      // 检查切换竞态
      if (idx_active == (active_first_otherwise_second_ ? 0 : 1)) {
        break;
      } else {
        --stores_[idx_active].refcnt_;  // 回退并重试
      }
    }

    Shared holder;
    holder.p_store_ = &stores_[idx_active].store_;
    holder.p_refcnt_ = &stores_[idx_active].refcnt_;
    return holder;
  }

 private:
  std::atomic_bool active_first_otherwise_second_;
  InnerStore stores_[2];  // 两个缓冲区
};
```

### 4.4 使用示例

```
// 配置类定义
class LoggerConfig : public EnableDoubleStore<LoggerConfig> {
 public:
  uint16_t Level() const { return level_; }
  std::string Pattern() const { return pattern_; }

 private:
  uint16_t level_;
  std::string pattern_;
};

// 写入流程（在配置更新回调中）
auto& conf = LoggerConfig::Writable();  // 获取非活跃缓冲区
conf.SetLevel(newLevel);                 // 更新
conf.SetPattern(newPattern);
LoggerConfig::SwitchActive();            // 原子切换

// 读取流程（在任意读线程中）
auto readable = LoggerConfig::Readable();  // 获取活跃缓冲区
uint16_t level = readable->Level();        // 安全读取
// readable 析构时自动减少引用计数
```

## 5. 配置更新流程

```
配置中心                    ConfigListener          ConfigManager
     │                           │                          │
     │ ──────配置变更推送────────>│                          │
     │                           │                          │
     │                      receiveConfigInfo()              │
     │                           │─────UpdateConfig()───────>│
     │                           │                     lock_guard(mutex)
     │                           │                     YAML::Load(content)
     │                           │                     遍历所有回调函数
     │                           │                     module.func_(node)
     │                           │                          │
     │                           │  <─────返回ok────────────│
```

## 6. 配置文件结构示例

```
# server.yaml
global:
  spdlog:
    queue_size: 8192
    thread_num: 2
    flush_interval: 3

log:
  level: 1
  pattern: "[%Y-%m-%d %H:%M:%S.%e] [%l] [%t] %v"
  file_size: 104857600
  file_num: 10

metric:
  enable: true
  port: 10188

server:
  port: 50051
  worker_thread_num: 8
  keepalive_time: 10000
  keepalive_timeout: 20000

game:
  default_level: 5

model:
  registers:
    - context: "battle_4v4"
      path: "./config/model/battle_4v4"
      models: [0, 1, 2, 5, 10, 11, 12]

rule:
  stages:
    - name: "pre"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0
              rules: ["safe_nav", "auto_reload"]
```

## 7. YAML 工具函数

```
namespace YAML {

// 安全的 YAML 解析（支持链式访问）
template <typename T, typename... Keys>
std::optional<T> SafeAs(const YAML::Node& node, const Keys&... keys) {
  YAML::Node current = YAML::Clone(node);

  for (const auto& key : std::initializer_list<std::string>{keys...}) {
    if (!current.IsMap() || !current[key].IsDefined()) {
      return std::nullopt;
    }
    current = current[key];
  }

  try {
    return current.as<T>();
  } catch (const YAML::BadConversion&) {
    return std::nullopt;
  }
}

}  // namespace YAML

// 使用示例
auto level = YAML::SafeAs<uint16_t>(node, "level").value_or(1);
auto port = YAML::SafeAs<uint16_t>(node, "service", "port").value_or(8080);
auto ids = YAML::SafeAs<std::vector<int>>(node, "models").value_or({});
```

## 8. 配置系统流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                       应用启动                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │ ConfigManager::GetInstance()->Initialize()
        └────────────────────┬───────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ 初始化配置中心客户端  │    │ 收集已注册的模块      │
    │ (通过环境变量配置)     │    │ (REGISTER_* 宏)      │
    └──────────────────────┘    └──────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │ 注册配置监听器                    │
    └──────────────────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────────┐   ┌────────────────────┐
    │  加载热更新配置     │   │   加载静态配置     │
    └─────────────────────┘   └────────────────────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                  ┌──────────────────────┐
                  │ UpdateConfig()       │
                  │ 1. YAML::Load()      │
                  │ 2. lock_guard()      │
                  │ 3. 遍历回调函数       │
                  │ 4. Writable()        │
                  │ 5. SwitchActive()    │
                  └──────────────────────┘
```

## 9. 扩展点：添加新配置模块

```
// 1. 创建配置类
class MyConfig : public EnableDoubleStore<MyConfig> {
 public:
  int Value() const { return value_; }
  void SetValue(int value) { value_ = value; }
 private:
  int value_;
};

// 2. 注册配置
REGISTER_RELOADABLE_CONFIG("server.yaml", my_module, [](const YAML::Node& node) {
  auto& conf = MyConfig::Writable();
  conf.SetValue(YAML::SafeAs<int>(node, "value").value_or(0));
  MyConfig::SwitchActive();
});

// 3. 在 YAML 中添加配置
// my_module:
//   value: 42

// 4. 使用配置
auto conf = MyConfig::Readable();
int value = conf->Value();
```
