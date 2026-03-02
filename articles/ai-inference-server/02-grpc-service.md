---
layout: article
title: "gRPC服务层"
description: "异步服务器、多CompletionQueue并发、Protobuf Arena优化"
level: advanced
tags: ["gRPC", "并发"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 2
prev:
  title: "配置系统"
  url: "01-config-system.html"
next:
  title: "模型推理系统"
  url: "03-model-inference.html"
---

## 1. 概述

使用 gRPC 异步服务器提供 AI 推理服务。核心特点：

- **异步处理**：基于 CompletionQueue 的非阻塞 I/O
- **多核并发**：每个 CPU 核心一个 CompletionQueue
- **高效内存**：使用 Protobuf Arena 分配
- **三阶段执行**：Preprocess → Predict → Finish

## 2. AsyncServer 异步服务器

### 2.1 类结构

```
template <typename ServiceType, typename RequestType,
          typename ReplyType, typename ServiceImplType>
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
  boost::thread_group worker_threads_;
};
```

### 2.2 多 CompletionQueue 并发模型

```
void AsyncServer::Bind() {
  grpc::ServerBuilder builder;

  // 配置网络参数
  builder.AddChannelArgument(GRPC_ARG_KEEPALIVE_TIME_MS, config_.KeepaliveTime());
  builder.AddChannelArgument(GRPC_ARG_KEEPALIVE_TIMEOUT_MS, config_.KeepaliveTimeout());
  builder.AddChannelArgument(GRPC_ARG_MAX_RECEIVE_MESSAGE_LENGTH, config_.MaxReceiveMessageLength());

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

### 2.3 请求处理循环

```
void AsyncServer::Run(int index, std::shared_ptr<ServiceImplType> service_imp) {
  // 设置线程名称
  pthread_setname_np(pthread_self(), fmt::format("worker_{}", index).c_str());

  // 创建初始的 AsyncServerData，准备接收请求
  new AsyncServerData<ServiceType, RequestType, ReplyType>(&service_, cqs_[index].get());

  bool ok = false;
  void* tag = NULL;

  // 事件循环
  while (cqs_[index]->Next(&tag, &ok)) {
    auto call_data = static_cast<AsyncServerData<...>*>(tag);

    if (!ok) {
      delete call_data;
      continue;
    }

    switch (call_data->Status()) {
      case AsyncDataStatus::kRPCDataProcess:
        // 立即创建新的 AsyncServerData 等待下一个请求
        new AsyncServerData<...>(&service_, cqs_[index].get());

        request_count_.fetch_add(1);
        call_data->SetStartTime(util::time::SteadyTimeNowUS());

        // 委托给服务实现处理
        service_imp->HandleRequest(call_data);
        break;

      case AsyncDataStatus::kRPCDataFinish:
        service_imp->HandleFinish(call_data);
        request_count_.fetch_sub(1);
        delete call_data;
        break;
    }
  }
}
```

## 3. AsyncServerData 请求数据容器

```
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

 private:
  google::protobuf::Arena arena_;  // Arena 自动管理消息生命周期
  RequestType* request_;
  ReplyType* reply_;
  grpc::ServerContext ctx_;
  grpc::ServerAsyncResponseWriter<ReplyType> responder_;
  AsyncDataStatus status_;
};
```

### Protobuf Arena 优势

```
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

优势：批量释放、减少碎片、更快分配

## 4. PredictExecutor 三阶段执行器

```
class PredictExecutor {
 public:
  PredictExecutor(ActionRequest* req, ActionResponse* reply)
      : req_(req), reply_(reply), start_time_(util::time::SteadyTimeNowUS()) {
    reply_->set_botid(req_->botid());
    reply_->set_gameid(req_->gameid());
    reply_->set_stamp(req_->stamp());
  }

  void Execute() {
    Preprocess();  // 阶段1: 数据预处理
    Predict();     // 阶段2: 模型推理
    Finish();      // 阶段3: 后处理
  }

 private:
  ActionRequest* req_;
  ActionResponse* reply_;
  std::shared_ptr<BaseContext> context_;
  int64_t start_time_;
};
```

## 5. 完整请求流程

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
└─────────────────────────────────────────────────────────────────┘
```

## 6. 性能优化

### 6.1 多 CompletionQueue

```
// 为每个 CPU 核心创建独立的 CompletionQueue
for (size_t i = 0; i < std::thread::hardware_concurrency(); ++i) {
  cqs_.emplace_back(builder.AddCompletionQueue());
}
```

优势：避免单个 CQ 成为瓶颈、多线程真正并行处理、减少锁竞争

### 6.2 原子计数

```
std::atomic_uint64_t request_count_;
request_count_.fetch_add(1);  // 无锁增加
request_count_.fetch_sub(1);  // 无锁减少
```

## 7. Protobuf 服务定义

```
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
  uint64 gameid = 1;
  uint64 botid = 2;
  uint64 stamp = 3;
  ResultInfo result = 4;  // 结果信息
  ActionList action = 5;  // 动作列表
  bytes extendinfo = 6;   // 扩展信息（下一帧使用）
}
```
