# gRPC 服务层 (gRPC Service Layer)

## 1. 概述

AIServer 使用 gRPC 异步服务器提供 AI 推理服务。核心特点：

- **异步处理**：基于 CompletionQueue 的非阻塞 I/O
- **多核并发**：每个 CPU 核心一个 CompletionQueue
- **高效内存**：使用 Protobuf Arena 分配
- **三阶段执行**：Preprocess → Predict → Finish

## 2. AsyncServer 异步服务器

### 2.1 类结构

**文件位置**: `src/service/grpc/async_server.h`

```cpp
template <typename ServiceType, typename RequestType, typename ReplyType, typename ServiceImplType>
class AsyncServer {
 public:
  AsyncServer(const ServerConfig& config) : config_(config), request_count_(0) {}

  void Bind();
  void Start();
  void Shutdown();

 private:
  void Run(int index, std::shared_ptr<ServiceImplType> service_imp);

  ServerConfig config_;
  ServiceType service_;
  std::vector<std::unique_ptr<grpc::ServerCompletionQueue>> cqs_;
  std::unique_ptr<grpc::Server> server_;
  std::atomic_uint64_t request_count_;
  std::atomic_int init_threads_;
  boost::thread_group worker_threads_;
  std::mutex init_mutex_;
  std::condition_variable init_cv_;
  boost::concurrent::sync_queue<int> service_queue_;
};
```

### 2.2 多 CompletionQueue 并发模型

```cpp
void AsyncServer::Bind() {
  grpc::ServerBuilder builder;

  // 配置网络参数
  builder.AddChannelArgument(GRPC_ARG_KEEPALIVE_TIME_MS, config_.KeepaliveTime());
  builder.AddChannelArgument(GRPC_ARG_KEEPALIVE_TIMEOUT_MS, config_.KeepaliveTimeout());
  builder.AddChannelArgument(GRPC_ARG_HTTP2_BDP_PROBE, 1);
  builder.AddChannelArgument(GRPC_ARG_MAX_CONNECTION_IDLE_MS, config_.MaxConnectionIdle());
  builder.AddChannelArgument(GRPC_ARG_MAX_RECEIVE_MESSAGE_LENGTH, config_.MaxReceiveMessageLength());
  builder.AddChannelArgument(GRPC_ARG_MAX_SEND_MESSAGE_LENGTH, config_.MaxSendMessageLength());

  // 绑定端口
  builder.AddListeningPort(fmt::format("0.0.0.0:{}", config_.Port()),
                           grpc::InsecureServerCredentials());

  // 注册服务
  builder.RegisterService(&service_);

  // 为每个 CPU 核心创建 CompletionQueue
  for (size_t i = 0; i < std::thread::hardware_concurrency(); ++i) {
    cqs_.emplace_back(builder.AddCompletionQueue());
  }

  server_ = builder.BuildAndStart();
}
```

### 2.3 启动流程

```cpp
void AsyncServer::Start() {
  // 创建工作线程
  for (size_t i = 0; i < std::thread::hardware_concurrency(); ++i) {
    worker_threads_.create_thread([this, i]() {
      // 1. 初始化服务实现
      auto service_imp = std::make_shared<ServiceImplType>();
      service_imp->Initialize();

      // 2. 增加初始化计数
      {
        std::lock_guard<std::mutex> lock(init_mutex_);
        init_threads_++;
        init_cv_.notify_one();
      }

      // 3. 等待所有线程初始化完成
      int signal;
      service_queue_.wait_pull(signal);

      // 4. 开始处理请求
      Run(i, service_imp);
    });
  }

  // 等待所有线程初始化
  {
    std::unique_lock<std::mutex> lock(init_mutex_);
    init_cv_.wait(lock, [this]() {
      return init_threads_ == std::thread::hardware_concurrency();
    });
  }

  // 绑定服务器
  Bind();

  // 通知所有线程开始工作
  for (size_t i = 0; i < std::thread::hardware_concurrency(); ++i) {
    service_queue_.push(0);
  }
}
```

### 2.4 请求处理循环

```cpp
void AsyncServer::Run(int index, std::shared_ptr<ServiceImplType> service_imp) {
  // 设置线程名称
  pthread_setname_np(pthread_self(), fmt::format("worker_{}", index).c_str());

  // 创建初始的 AsyncServerData，准备接收请求
  new AsyncServerData<ServiceType, RequestType, ReplyType>(&service_, cqs_[index].get());

  bool ok = false;
  void* tag = NULL;

  // 事件循环
  while (cqs_[index]->Next(&tag, &ok)) {
    auto call_data = static_cast<AsyncServerData<ServiceType, RequestType, ReplyType>*>(tag);

    if (!ok) {
      delete call_data;
      continue;
    }

    switch (call_data->Status()) {
      case AsyncDataStatus::kRPCDataProcess:
        // 立即创建新的 AsyncServerData 等待下一个请求
        new AsyncServerData<ServiceType, RequestType, ReplyType>(&service_, cqs_[index].get());

        request_count_.fetch_add(1);
        call_data->SetStartTime(util::time::SteadyTimeNowUS());

        // 委托给服务实现处理
        service_imp->HandleRequest(call_data);
        break;

      case AsyncDataStatus::kRPCDataFinish:
        // 处理完成回调
        service_imp->HandleFinish(call_data);
        request_count_.fetch_sub(1);
        delete call_data;
        break;

      default:
        delete call_data;
        break;
    }
  }
}
```

## 3. AsyncServerData 请求数据容器

### 3.1 类结构

**文件位置**: `src/service/grpc/async_server_data.h`

```cpp
enum class AsyncDataStatus : uint8_t {
  kRPCDataCreate,   // 创建
  kRPCDataProcess,  // 处理中
  kRPCDataFinish,   // 完成
  kRPCDataError     // 错误
};

template <typename ServiceType, typename RequestType, typename ReplyType>
class AsyncServerData {
 public:
  AsyncServerData(ServiceType* service, grpc::ServerCompletionQueue* cq)
      : service_(service), cq_(cq), responder_(&ctx_),
        status_(AsyncDataStatus::kRPCDataCreate) {
    // 使用 Protobuf Arena 分配消息（高效）
    request_ = google::protobuf::Arena::CreateMessage<RequestType>(&arena_);
    reply_ = google::protobuf::Arena::CreateMessage<ReplyType>(&arena_);

    // 立即注册 RPC 请求接收
    status_ = AsyncDataStatus::kRPCDataProcess;
    service_->RequestDoRequest(&ctx_, request_, &responder_, cq_, cq_, this);
  }

  void SendReply() {
    status_ = AsyncDataStatus::kRPCDataFinish;
    responder_.Finish(*reply_, grpc::Status::OK, this);
  }

  RequestType* Request() { return request_; }
  ReplyType* Reply() { return reply_; }
  AsyncDataStatus Status() { return status_; }
  int64_t StartTime() { return start_time_; }
  void SetStartTime(int64_t time) { start_time_ = time; }

 private:
  google::protobuf::Arena arena_;  // Arena 自动管理消息生命周期
  RequestType* request_;
  ReplyType* reply_;
  grpc::ServerContext ctx_;
  grpc::ServerAsyncResponseWriter<ReplyType> responder_;
  AsyncDataStatus status_;
  int64_t start_time_;
  ServiceType* service_;
  grpc::ServerCompletionQueue* cq_;
};
```

### 3.2 Protobuf Arena 优势

```cpp
// 传统分配方式
Request* request = new Request();  // 堆分配
// ... 使用 request ...
delete request;                     // 手动释放

// Arena 分配方式
google::protobuf::Arena arena;
Request* request = Arena::CreateMessage<Request>(&arena);
// ... 使用 request ...
// arena 析构时自动释放所有消息
```

**优势**：
- **批量释放**：Arena 析构时一次性释放所有内存
- **减少碎片**：连续内存分配
- **更快分配**：避免频繁的 malloc/free

## 4. PredictService 服务实现

### 4.1 类结构

**文件位置**: `src/service/predict_service.h`

```cpp
using PredictData = grpcx::AsyncServerData<
    ai::ActionService::AsyncService,
    ai::ActionRequest,
    ai::ActionResponse>;

class PredictService
    : public grpcx::ServiceImpl<ai::ActionService::AsyncService,
                                ai::ActionRequest,
                                ai::ActionResponse> {
 public:
  void Initialize() override;
  void HandleRequest(PredictData* call_data) override;
  void HandleTimeout(PredictData* call_data) override;
  void HandleFinish(PredictData* call_data) override;
};
```

### 4.2 实现

**文件位置**: `src/service/predict_service.cc`

```cpp
void PredictService::Initialize() {
  // 初始化模型上下文（线程本地）
  core::model::ModelManager::GetInstance()->InitializeModelContext();
  // 初始化渲染上下文（线程本地）
  core::obj::ObjManager::GetInstance()->InitializeRenderContext();
}

void PredictService::HandleRequest(PredictData* call_data) {
  // 创建执行器
  service::PredictExecutor executor(call_data->Request(), call_data->Reply());

  // 执行三阶段流程
  executor.Execute();

  // 发送响应
  call_data->SendReply();

  // 上报指标
  REPORT_SERVICE_REQUEST(common::metric::MetricType::kPredictReq);
}

void PredictService::HandleTimeout(PredictData* call_data) {
  LOG_ERROR("predict timeout|game_id: ", call_data->Request()->gameid(),
            "bot_id: ", call_data->Request()->botid());
}

void PredictService::HandleFinish(PredictData* call_data) {
  LOG_DEBUG("predict finish|game_id: ", call_data->Request()->gameid(),
            "bot_id: ", call_data->Request()->botid());
}
```

## 5. PredictExecutor 三阶段执行器

### 5.1 类结构

**文件位置**: `src/service/predict_executor.h`

```cpp
class PredictExecutor {
 public:
  PredictExecutor(ai::ActionRequest* req, ai::ActionResponse* reply)
      : req_(req), reply_(reply), start_time_(util::time::SteadyTimeNowUS()) {
    reply_->set_botid(req_->botid());
    reply_->set_gameid(req_->gameid());
    reply_->set_stamp(req_->stamp());
  }

  void Execute() {
    Preprocess();
    Predict();
    Finish();
  }

 private:
  void Preprocess();
  void Predict();
  void Finish();
  void GenerateActions();

  ai::ActionRequest* req_;
  ai::ActionResponse* reply_;
  std::shared_ptr<e::BaseContext> context_;
  int64_t start_time_;
};
```

### 5.2 Preprocess 阶段

```cpp
void PredictExecutor::Preprocess() {
  // 1. 反序列化请求
  const auto& state_info = req_->info().botstate();
  e::AgentStatePtr agent_state = std::make_shared<e::AgentState>();
  if (!g::ProtoAdapter::ConvertFromProto(state_info, &(agent_state->m_state))) {
    return;
  }

  // 2. 构建游戏信息
  e::GameInfo game_info;
  game_info.m_gameID = req_->gameid();
  if (!BuildGameInfo(agent_state->m_state, &game_info)) {
    return;
  }

  // 3. 状态适配
  STATE_ADAPTER()->ProcessState(agent_state->m_state, true, game_info.m_mode);

  // 4. 解析扩展数据（历史状态）
  bool first_frame = req_->info().extendinfo().empty();
  ai::ExtendInfo ei;
  e::AgentDataPtr agent_data = std::make_shared<e::AgentData>();
  if (!first_frame) {
    ei.ParseFromString(req_->info().extendinfo());
    g::ProtoAdapter::ConvertFromProto(ei, agent_data.get());
  }

  // 5. 解析队友信息
  ParseAllyInfos(agent_state->m_state, &allies, &ally_indexes, &ally_extend_infos, game_info.m_mode);

  // 6. 等级调整（剧本系统）
  int32_t level = agent_state->m_state.m_botConfig.m_level;
  if (!freeze_level) {
    bool drama_adjust = DRAMA_CONTROL_MODULE()->DramaControlLevel(...);
    if (drama_adjust) {
      level = std::ceil(double_level / 2.f);
    }
  }

  // 7. 创建 Context
  std::string mode_name = e::CommonContants::gameModeToString(e::GameModeType(game_info.m_mode));
  context_ = std::shared_ptr<e::BaseContext>(CREATE_CLASS_INSTANCE(mode_name, e::BaseContext));

  // 8. 初始化 Context
  context_->InitOnline(first_frame, agent_data, game_info, level_config, lv50_config);
  context_->SetLevel(level);
  context_->BeginIter(agent_state, allies, ally_extend_infos, actor_buffs);
}
```

### 5.3 Predict 阶段

```cpp
void PredictExecutor::Predict() {
  auto start_time = util::time::SteadyTimeNowUS();
  if (!context_) {
    return;
  }

  // 1. 执行前置规则
  auto pre_match_ret = core::rule::RuleManager::GetInstance()
      ->MatchRules(core::rule::RuleType::kPre, context_.get());
  context_->SetMatchPreRule(pre_match_ret);

  // 2. 如果前置规则不匹配，执行模型推理
  if (pre_match_ret.second != e::MatchType::MATCH_OK) {
    core::model::ModelManager::GetInstance()->Predict(context_);
  }

  context_->AddTimecostRecord(e::TimecostTag::kPredict, "main",
                               util::time::SteadyTimeNowUS() - start_time);
}
```

### 5.4 Finish 阶段

```cpp
void PredictExecutor::Finish() {
  auto start_time = util::time::SteadyTimeNowUS();
  if (!context_) {
    reply_->mutable_result()->set_code(99);
    reply_->mutable_result()->set_error_info("illegal request");
    return;
  }

  reply_->mutable_result()->set_code(0);
  reply_->mutable_result()->set_error_info("");

  // 1. 结束迭代
  context_->EndIter();

  // 2. 生成动作
  GenerateActions();

  // 3. 记录时间
  context_->AddTimecostRecord(e::TimecostTag::kEnd, "main",
                               util::time::SteadyTimeNowUS() - start_time);
}
```

### 5.5 GenerateActions

```cpp
void PredictExecutor::GenerateActions() {
  e::AgentActionPtr agent_action = context_->GetAction();
  const g::BotState& bs = context_->BotState();

  if (!agent_action->m_actionDict.empty()) {
    g::ActionListPtr action_list = std::make_shared<g::ActionList>(
        bs.m_state.m_id, bs.m_requestID);

    // 按优先级顺序添加动作
    static const std::vector<g::ActionType> action_orders = {
        g::ActionType::ACTION_FOCUS,
        g::ActionType::ACTION_MOVE,
        g::ActionType::ACTION_FIRE,
        g::ActionType::ACTION_AIM,
        g::ActionType::ACTION_INTERACT,
        // ... 更多动作类型
    };

    for (g::ActionType action_type : action_orders) {
      if (!agent_action->m_actionDict.count(action_type)) continue;

      g::ActionPtr current_action = agent_action->m_actionDict[action_type];

      // 特殊转换（如 STOP_INTERACT → INTERACT）
      if (action_type == g::ActionType::ACTION_STOP_INTERACT) {
        current_action->m_action = g::ActionType::ACTION_INTERACT;
      }

      // 去重检查
      if (e::LogicUtils::find(action_list->m_actions, current_action)) {
        continue;
      }

      action_list->m_actions.emplace_back(current_action);
    }

    STATE_ADAPTER()->ProcessActionList(action_list);
    actions = action_list;
  }

  // 序列化到 protobuf
  g::ProtoAdapter::ConvertToProto(actions, reply_->mutable_action());
  g::ProtoAdapter::ConvertToProto(context_->GetAITraceInfo(), reply_->mutable_trace_info());

  // 保存扩展信息
  ai::ExtendInfo ei;
  g::ProtoAdapter::ConvertToProto(context_->GetHistoryData(), ei);
  ei.SerializeToString(reply_->mutable_extendinfo());
}
```

## 6. ServerConfig 配置

**文件位置**: `src/service/grpc/server_config.h`

```cpp
class ServerConfig {
 public:
  uint16_t Port() const { return port_; }
  uint16_t WorkerThreadNum() const { return worker_thread_num_; }
  uint32_t KeepaliveTime() const { return keepalive_time_; }
  uint32_t KeepaliveTimeout() const { return keepalive_timeout_; }
  uint32_t MaxConnectionIdle() const { return max_connection_idle_; }
  uint32_t MaxReceiveMessageLength() const { return max_receive_message_length_; }
  uint32_t MaxSendMessageLength() const { return max_send_message_length_; }

 private:
  uint16_t port_;                           // 监听端口
  uint16_t worker_thread_num_;              // 工作线程数
  uint32_t keepalive_time_;                 // 心跳间隔 (ms)
  uint32_t keepalive_timeout_;              // 心跳超时 (ms)
  uint32_t max_connection_idle_;            // 最大空闲时间 (ms)
  uint32_t max_receive_message_length_;     // 最大接收消息大小
  uint32_t max_send_message_length_;        // 最大发送消息大小
};
```

## 7. Protobuf 服务定义

**文件位置**: `proto/strinova/action_service.proto`

```protobuf
service ActionService {
  rpc DoRequest(ActionRequest) returns (ActionResponse);
}

message ActionRequest {
  uint64 gameid = 1;      // 游戏ID
  uint64 botid = 2;       // Bot ID
  uint64 stamp = 3;       // 时间戳
  RequestInfo info = 4;   // 请求信息
}

message ActionResponse {
  uint64 gameid = 1;      // 游戏ID
  uint64 botid = 2;       // Bot ID
  uint64 stamp = 3;       // 时间戳
  ResultInfo result = 4;  // 结果信息
  ActionList action = 5;  // 动作列表
  bytes extendinfo = 6;   // 扩展信息（下一帧使用）
  TraceInfo trace_info = 7; // 追踪信息
}
```

## 8. 完整请求流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Request (ActionRequest)               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              AsyncServer::Run (per CompletionQueue)              │
├─────────────────────────────────────────────────────────────────┤
│ while (cqs_[index]->Next(&tag, &ok)) {                          │
│   switch (call_data->Status()) {                                │
│     case kRPCDataProcess:                                       │
│       new AsyncServerData(...);  // 准备接收下一个请求            │
│       request_count_++;                                         │
│       service_imp->HandleRequest(call_data);                    │
│       break;                                                    │
│     case kRPCDataFinish:                                        │
│       service_imp->HandleFinish(call_data);                     │
│       request_count_--;                                         │
│       delete call_data;                                         │
│       break;                                                    │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               PredictService::HandleRequest                      │
├─────────────────────────────────────────────────────────────────┤
│ PredictExecutor executor(request, reply);                        │
│ executor.Execute();                                              │
│ call_data->SendReply();                                          │
│ REPORT_SERVICE_REQUEST(...);                                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PredictExecutor::Execute()                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Preprocess()                                                │ │
│ │  • 反序列化 protobuf                                         │ │
│ │  • 构建 GameInfo                                            │ │
│ │  • 状态适配                                                  │ │
│ │  • 创建 Context                                             │ │
│ │  • BeginIter()                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Predict()                                                   │ │
│ │  • 执行前置规则                                              │ │
│ │  • 如果需要，执行 ONNX 推理                                   │ │
│ │  • 执行后置规则                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Finish()                                                    │ │
│ │  • EndIter()                                                │ │
│ │  • GenerateActions()                                        │ │
│ │  • 序列化响应                                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Response (ActionResponse)                      │
└─────────────────────────────────────────────────────────────────┘
```

## 9. 性能优化

### 9.1 多 CompletionQueue

```cpp
// 为每个 CPU 核心创建独立的 CompletionQueue
for (size_t i = 0; i < std::thread::hardware_concurrency(); ++i) {
  cqs_.emplace_back(builder.AddCompletionQueue());
}
```

**优势**：
- 避免单个 CQ 成为瓶颈
- 多线程真正并行处理
- 减少锁竞争

### 9.2 Protobuf Arena

```cpp
// 在 AsyncServerData 构造函数中
google::protobuf::Arena arena_;
request_ = Arena::CreateMessage<RequestType>(&arena_);
reply_ = Arena::CreateMessage<ReplyType>(&arena_);
```

**优势**：
- 批量内存释放
- 减少内存碎片
- 更快的分配速度

### 9.3 原子计数

```cpp
std::atomic_uint64_t request_count_;
request_count_.fetch_add(1);  // 无锁增加
request_count_.fetch_sub(1);  // 无锁减少
```

### 9.4 线程命名

```cpp
pthread_setname_np(pthread_self(), fmt::format("worker_{}", index).c_str());
```

**便于调试和监控**

## 10. 扩展点

### 10.1 添加新的 RPC 方法

1. **更新 proto 文件**:

```protobuf
service ActionService {
  rpc DoRequest(ActionRequest) returns (ActionResponse);
  rpc NewMethod(NewRequest) returns (NewResponse);  // 新方法
}
```

2. **更新 ServiceImpl**:

```cpp
class PredictService : public ServiceImpl<...> {
  void HandleNewMethod(NewMethodData* call_data);
};
```

### 10.2 添加请求拦截器

```cpp
void PredictService::HandleRequest(PredictData* call_data) {
  // 前置拦截
  if (!ValidateRequest(call_data->Request())) {
    call_data->Reply()->mutable_result()->set_code(1);
    call_data->SendReply();
    return;
  }

  // 正常处理
  PredictExecutor executor(call_data->Request(), call_data->Reply());
  executor.Execute();

  // 后置拦截
  LogResponse(call_data->Reply());

  call_data->SendReply();
}
```
