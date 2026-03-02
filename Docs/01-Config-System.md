# 配置系统 (Config System)

## 1. 概述

AIServer 的配置系统支持两种配置模式：
- **静态配置**：启动时从本地文件加载，不支持运行时更新
- **热更新配置**：从 NACOS 配置中心加载，支持运行时动态更新

核心特性：
- 双缓冲机制实现无锁读取
- NACOS 集成支持配置推送
- 宏驱动的自动注册

## 2. ConfigManager 设计

### 2.1 类结构

**文件位置**: `src/common/config/config_manager.h`

```cpp
class ConfigManager {
  MAKE_SINGLETON(ConfigManager);

 public:
  using ReloadFunc = std::function<void(const YAML::Node&)>;

  struct ModuleConfig {
    std::string name_;      // 模块名（YAML 中的 key）
    ReloadFunc func_;       // 配置更新回调函数
  };

  // 初始化：连接 NACOS、加载配置
  bool Initialize();

  // 注册热更新配置
  bool RegisterReloadableConfig(const std::string& file_name,
                                const std::string& module_name,
                                ReloadFunc func);

  // 注册静态配置
  bool RegisterStaticConfig(const std::string& file_name,
                            const std::string& module_name,
                            ReloadFunc func);

  // 更新配置（内部调用）
  bool UpdateConfig(const std::string& file_name,
                    const std::string& file_content,
                    bool is_reloadable);

 private:
  bool LoadConfig();
  void RegisterReloadableConfigListener();

  // 按文件名组织的模块注册表
  std::unordered_map<std::string, std::vector<ModuleConfig>> reloadable_modules_by_file_;
  std::unordered_map<std::string, std::vector<ModuleConfig>> static_modules_by_file_;

  std::mutex update_mutex_;                            // 更新互斥锁
  std::unique_ptr<nacos::ConfigService> config_service_;  // NACOS 客户端
  std::vector<nacos::Listener> config_listeners_;      // 配置监听器
};
```

### 2.2 单例模式实现

**文件位置**: `src/common/clazz/singleton.h`

```cpp
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
    return &instance;                              \
  }
```

### 2.3 初始化流程

```cpp
bool ConfigManager::Initialize() {
  // 1. 初始化 NACOS 客户端
  nacos::Properties props;
  props[nacos::PropertyKeyConst::SERVER_ADDR] =
    util::system::GetEnv("NACOS_SERVER_ADDR").value_or("");
  props[nacos::PropertyKeyConst::NAMESPACE] =
    util::system::GetEnv("NACOS_NAMESPACE").value_or("");
  props[nacos::PropertyKeyConst::LOG_PATH] = "./nacos/logs";
  props[nacos::PropertyKeyConst::LOG_LEVEL] = "ERROR";
  props[nacos::PropertyKeyConst::NACOS_SNAPSHOT_PATH] = "./nacos/cache";

  config_service_ = std::unique_ptr<nacos::ConfigService>(
      nacos::NacosFactoryFactory::getNacosFactory(props)->CreateConfigService());

  // 2. 注册 NACOS 监听器
  RegisterReloadableConfigListener();

  // 3. 加载配置
  return LoadConfig();
}
```

## 3. 静态配置 vs 热更新配置

### 3.1 配置类型对比

| 特性 | 静态配置 | 热更新配置 |
|------|---------|-----------|
| 加载时机 | 启动时 | 启动时 + 运行时 |
| 数据源 | 本地文件 | NACOS 配置中心 |
| 更新方式 | 重启服务 | NACOS 推送 |
| 线程安全 | 无需特殊处理 | 双缓冲机制 |
| 典型用途 | 模型路径、OBJ 配置 | 日志级别、游戏参数 |

### 3.2 注册宏定义

**文件位置**: `src/common/config/config_manager.h`

```cpp
// 注册热更新配置
#define REGISTER_RELOADABLE_CONFIG(file_name, module_name, ReloadFunc)        \
  static bool reloadable_config_##module_name =                               \
      common::config::ConfigManager::GetInstance()->RegisterReloadableConfig( \
          file_name, #module_name, [](const YAML::Node& node) { ReloadFunc(node); });

// 静态配置文件路径（基于 SERVER_NAME 环境变量）
static const std::string kStaticConfigPath =
    fmt::format("./config/{}.yaml",
                util::system::GetEnv("SERVER_NAME").value_or("ai_server"));

// 注册静态配置
#define REGISTER_STATIC_CONFIG(module_name, ReloadFunc)                       \
  static bool static_config_##module_name =                                   \
      common::config::ConfigManager::GetInstance()->RegisterStaticConfig(     \
          kStaticConfigPath, #module_name,
          [](const YAML::Node& node) { ReloadFunc(node); });
```

### 3.3 使用示例

**热更新配置** (`src/common/log/logger_config.cc`):

```cpp
REGISTER_RELOADABLE_CONFIG("ai_server.yaml", log, [](const YAML::Node& node) {
  // 1. 获取可写的配置对象
  auto& conf = LoggerConfig::Writable();

  // 2. 从 YAML 解析
  conf = node.as<LoggerConfig>();

  // 3. 记录日志
  spdlog::info("log config updated: {}", conf);

  // 4. 切换为活跃配置
  LoggerConfig::SwitchActive();
});
```

**静态配置** (`src/core/model/model_config.cc`):

```cpp
REGISTER_STATIC_CONFIG(model, [](const YAML::Node& config) {
  ModelConfig::GetInstance()->Initialize(config);
});
```

## 4. NACOS 集成

### 4.1 ConfigListener 实现

```cpp
class ConfigListener : public nacos::Listener {
 public:
  ConfigListener(const std::string& data_id, const std::string& group)
    : data_id_(data_id), group_(group) {
    setListenerName(fmt::format("{}-{}", group_, data_id_));
  }

  const std::string& DataID() const { return data_id_; }
  const std::string& Group() const { return group_; }

  // NACOS 配置变更回调
  virtual void receiveConfigInfo(const NacosString& config_info) override {
    ConfigManager::GetInstance()->UpdateConfig(DataID(), config_info, true);
  }

 private:
  std::string data_id_;
  std::string group_;
};
```

### 4.2 监听器注册

```cpp
void ConfigManager::RegisterReloadableConfigListener() {
  for (const auto& [file_name, modules] : reloadable_modules_by_file_) {
    auto listener = new ConfigListener(file_name, GroupID());
    config_service_->addListener(listener->DataID(),
                                 listener->Group(),
                                 listener);
  }
}

// GroupID 格式: grpc.{APP_NAME}.{SERVER_NAME}
std::string GroupID() {
  std::string app_name = util::system::GetEnv("APP_NAME").value_or("ai");
  std::string server_name = util::system::GetEnv("SERVER_NAME").value_or("ai_server");
  return fmt::format("grpc.{}.{}", app_name, server_name);
}
```

### 4.3 配置更新流程

```
NACOS 服务器                  ConfigListener          ConfigManager
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

## 5. EnableDoubleStore 双缓冲机制

### 5.1 设计目标

- **无锁读取**：读线程不需要获取锁
- **原子切换**：写完成后瞬间切换
- **引用计数**：确保安全释放

### 5.2 类结构

**文件位置**: `src/util/container/enable_double_store.h`

```cpp
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

### 5.3 DoubleStore 实现

**文件位置**: `src/util/container/atomic_double_store.h`

```cpp
template <typename TStore>
class DoubleStore {
 public:
  class Shared {
   public:
    const TStore* operator->() const { return p_store_; }
    const TStore& operator*() const { return *p_store_; }

    ~Shared() {
      if (p_refcnt_) {
        --(*p_refcnt_);  // 析构时递减引用计数
      }
    }

   private:
    std::atomic<int64_t>* p_refcnt_;
    const TStore* p_store_;
  };

 private:
  struct InnerStore {
    TStore store_;
    std::atomic<int64_t> refcnt_ = 0;
  };

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

### 5.4 使用示例

**配置类定义**:

```cpp
class LoggerConfig : public util::container::EnableDoubleStore<LoggerConfig> {
 public:
  uint16_t Level() const { return level_; }
  void SetLevel(uint16_t level) { level_ = level; }

  std::string Pattern() const { return pattern_; }
  void SetPattern(const std::string& pattern) { pattern_ = pattern; }

 private:
  uint16_t level_;
  std::string pattern_;
};
```

**写入流程**:

```cpp
// 在配置更新回调中
auto& conf = LoggerConfig::Writable();  // 获取非活跃缓冲区
conf.SetLevel(newLevel);                 // 更新
conf.SetPattern(newPattern);
LoggerConfig::SwitchActive();            // 原子切换
```

**读取流程**:

```cpp
// 在任意读线程中
auto readable = LoggerConfig::Readable();  // 获取活跃缓冲区的共享指针
uint16_t level = readable->Level();        // 安全读取
// readable 析构时自动减少引用计数
```

## 6. 配置文件结构

### 6.1 ai_server.yaml 示例

```yaml
# 全局配置
global:
  spdlog:
    queue_size: 8192
    thread_num: 2
    flush_interval: 3

# 日志配置
log:
  level: 1
  pattern: "[%Y-%m-%d %H:%M:%S.%e] [%l] [%t] %v"
  file_size: 104857600
  file_num: 10

# 指标配置
metric:
  enable: true
  port: 10188

# 服务配置
server:
  port: 50051
  worker_thread_num: 8
  keepalive_time: 10000
  keepalive_timeout: 20000

# 游戏配置
game:
  default_level: 5
  drama_enabled: true

# 模型配置
model:
  registers:
    - context: "battle_4v4"
      path: "./config/model/battle_4v4"
      models: [0, 1, 2, 5, 10, 11, 12]
  selectors:
    - map_id: 111
      styles:
        - { name: "battle", context: "battle_4v4", mode_id: 1 }
        - { name: "navigation", context: "battle_4v4", mode_id: 0 }

# 规则配置
rule:
  stages:
    - name: "pre"
      contexts:
        - name: "battle_4v4"
          modes:
            - id: 0
              rules: ["safe_nav", "bomb_throw", "auto_reload"]
```

### 6.2 已注册的配置列表

| 配置文件 | 模块名 | 类型 | 说明 |
|---------|--------|------|------|
| ai_server.yaml | global | 热更新 | 全局配置 |
| ai_server.yaml | log | 热更新 | 日志配置 |
| ai_server.yaml | metric | 热更新 | 指标配置 |
| ai_server.yaml | game | 热更新 | 游戏参数 |
| ai_server.yaml | server | 热更新 | gRPC 配置 |
| drama_pc.yaml | drama_pc | 热更新 | PC 剧本 |
| drama_mb.yaml | drama_mb | 热更新 | Mobile 剧本 |
| level.yaml | level | 热更新 | 等级配置 |
| ai_server.yaml | model | 静态 | 模型配置 |
| ai_server.yaml | map | 静态 | 地图配置 |
| ai_server.yaml | obj | 静态 | OBJ 配置 |
| ai_server.yaml | rule | 静态 | 规则配置 |

## 7. YAML 工具函数

**文件位置**: `src/util/yaml/yaml_util.h`

```cpp
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
```

**使用示例**:

```cpp
// 单层访问
auto level = YAML::SafeAs<uint16_t>(node, "level").value_or(1);

// 多层访问
auto port = YAML::SafeAs<uint16_t>(node, "service", "port").value_or(8080);

// 容器类型
auto ids = YAML::SafeAs<std::vector<int>>(node, "models").value_or({});
```

## 8. 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NACOS_SERVER_ADDR` | NACOS 服务器地址 | "" |
| `NACOS_NAMESPACE` | NACOS 命名空间 | "" |
| `APP_NAME` | 应用名称 | "ai" |
| `SERVER_NAME` | 服务器名称 | "ai_server" |

## 9. 配置系统流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                       应用启动 (ai_server.cc)                         │
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
    │ 初始化 NACOS 客户端   │    │ 收集已注册的模块      │
    │ (通过环境变量配置)     │    │ (REGISTER_* 宏)      │
    └──────────────────────┘    └──────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │ RegisterReloadableConfigListener()
    │ 为每个热更新配置注册 NACOS 监听器
    └──────────────────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────────┐   ┌────────────────────┐
    │  加载热更新配置     │   │   加载静态配置     │
    │ (从 NACOS)          │   │  (从本地文件)      │
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

## 10. 扩展点

### 10.1 添加新配置模块

1. **创建配置类**:

```cpp
// my_config.h
class MyConfig : public util::container::EnableDoubleStore<MyConfig> {
 public:
  int Value() const { return value_; }
  void SetValue(int value) { value_ = value; }
 private:
  int value_;
};
```

2. **注册配置**:

```cpp
// my_config.cc
REGISTER_RELOADABLE_CONFIG("ai_server.yaml", my_module, [](const YAML::Node& node) {
  auto& conf = MyConfig::Writable();
  conf.SetValue(YAML::SafeAs<int>(node, "value").value_or(0));
  MyConfig::SwitchActive();
});
```

3. **在 YAML 中添加配置**:

```yaml
my_module:
  value: 42
```

4. **使用配置**:

```cpp
auto conf = MyConfig::Readable();
int value = conf->Value();
```

### 10.2 自定义 YAML 转换器

```cpp
namespace YAML {
template <>
struct convert<MyCustomType> {
  static bool decode(const Node& node, MyCustomType& rhs) {
    if (!node.IsMap()) return false;
    rhs.field1 = YAML::SafeAs<int>(node, "field1").value_or(0);
    rhs.field2 = YAML::SafeAs<std::string>(node, "field2").value_or("");
    return true;
  }
};
}
```
