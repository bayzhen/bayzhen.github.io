---
layout: article
title: "3D渲染系统"
description: "OSMesa离屏渲染、深度图生成、BVH射线追踪"
level: advanced
tags: ["渲染", "射线追踪"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 11
prev:
  title: "寻路系统"
  url: "10-pathfinding.html"
next:
  title: "Utility AI决策系统"
  url: "12-utility-ai.html"
---

## 1. 概述

3D渲染系统提供离屏渲染能力，用于生成深度图和执行射线追踪(LineTrace)。系统使用OSMesa进行离屏OpenGL渲染，支持多线程并发渲染，生成的深度信息用于AI决策（如视野判断、障碍物检测）。

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        ObjManager                                │
│                     (Singleton Pattern)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │    obj_renders_: unordered_map<int, shared_ptr<ObjRender>>  ││
│  │  ┌───────────────────────────────────────────────────────┐ ││
│  │  │  MapID → ObjRender                                    │ ││
│  │  │  ┌─────────────────────────────────────────────────┐ │ ││
│  │  │  │ 1001 (MAP_A)  → ObjRender{mesh, textures}       │ │ ││
│  │  │  │ 1002 (MAP_B)  → ObjRender{mesh, textures}       │ │ ││
│  │  │  │ ...           → ...                             │ │ ││
│  │  │  └─────────────────────────────────────────────────┘ │ ││
│  │  └───────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  thread_local ObjContext obj_context_                       ││
│  │  每个线程独立的OpenGL上下文                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│      ObjRender        │           │      ObjContext       │
├───────────────────────┤           ├───────────────────────┤
│ 地图3D网格数据        │           │ OSMesa上下文          │
│ 顶点/纹理缓冲        │           │ 帧缓冲                │
│ 渲染方法             │           │ 深度缓冲              │
└───────────────────────┘           └───────────────────────┘
```

## 3. 核心类设计

### ObjManager 单例

```
class ObjManager {
  MAKE_SINGLETON(ObjManager);

 public:
  // 初始化管理器
  bool Initialize();

  // 初始化渲染上下文 (每个线程调用一次)
  bool InitializeRenderContext();

  // 渲染深度图
  bool Render(int32_t map_id,
              float min_z, float max_z,
              const BotInfo& bot,
              std::vector<float>& depth_result,
              int buffer_size,
              int width, int height);

  // 射线追踪
  bool LineTrace(int32_t map_id,
                 const BotInfo& bot,
                 std::vector<float>& bot_result);

 private:
  // 线程本地存储的渲染上下文
  static thread_local std::unique_ptr<ObjContext> obj_context_;

  // 地图渲染器映射
  std::unordered_map<int32_t, std::shared_ptr<ObjRender>> obj_renders_;

  // 渲染器访问互斥锁
  std::mutex render_mutex_;
};
```

### ObjContext 渲染上下文

```
class ObjContext {
 public:
  ObjContext();
  ~ObjContext();

  // 初始化OSMesa上下文
  bool Initialize(int width, int height);

  // 绑定上下文
  bool MakeCurrent();

  // 获取深度缓冲
  float* GetDepthBuffer() { return depth_buffer_.data(); }

  // 获取帧缓冲
  unsigned char* GetFrameBuffer() { return frame_buffer_.data(); }

 private:
  OSMesaContext mesa_context_;
  std::vector<unsigned char> frame_buffer_;
  std::vector<float> depth_buffer_;
  int width_;
  int height_;
};
```

### ObjRender 地图渲染器

```
class ObjRender {
 public:
  // 加载地图模型
  bool LoadModel(const std::string& objPath);

  // 渲染深度图
  bool RenderDepth(const CameraParams& camera,
                   float min_z, float max_z,
                   std::vector<float>& depth_result,
                   int width, int height);

  // 执行射线追踪
  bool LineTrace(const Vector& origin,
                 const Vector& direction,
                 float max_distance,
                 HitResult& result);

  // 批量射线追踪
  bool BatchLineTrace(const std::vector<Ray>& rays,
                      std::vector<HitResult>& results);

 private:
  // OpenGL 对象
  GLuint vao_;           // 顶点数组对象
  GLuint vbo_;           // 顶点缓冲对象
  GLuint ebo_;           // 索引缓冲对象
  GLuint shader_;        // 着色器程序

  // 网格数据
  std::vector<Vertex> vertices_;
  std::vector<uint32_t> indices_;

  // BVH 加速结构 (用于射线追踪)
  std::unique_ptr<BVHTree> bvh_tree_;
};
```

## 4. 深度图渲染

### 渲染流程

```
Render(map_id, min_z, max_z, bot, depth_result, ...)
    │
    ├──► 获取/创建线程本地 ObjContext
    │    └── InitializeRenderContext()
    │
    ├──► 获取地图 ObjRender
    │    └── obj_renders_[map_id]
    │
    ├──► 设置相机参数
    │    ├── 位置: bot.position
    │    ├── 朝向: bot.rotation
    │    └── FOV: bot.fov
    │
    ├──► OSMesa 渲染
    │    ├── glClear(GL_DEPTH_BUFFER_BIT)
    │    ├── glMatrixMode(GL_PROJECTION)
    │    ├── gluPerspective(fov, aspect, near, far)
    │    ├── glMatrixMode(GL_MODELVIEW)
    │    ├── gluLookAt(...)
    │    └── DrawMesh()
    │
    ├──► 读取深度缓冲
    │    └── glReadPixels(GL_DEPTH_COMPONENT)
    │
    └──► 归一化深度值
         └── depth = (depth - min_z) / (max_z - min_z)
```

### 深度图生成代码

```
bool ObjRender::RenderDepth(
    const CameraParams& camera,
    float min_z, float max_z,
    std::vector<float>& depth_result,
    int width, int height) {

  // 设置投影矩阵
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  gluPerspective(camera.fov, (float)width / height, min_z, max_z);

  // 设置视图矩阵
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();
  gluLookAt(
      camera.position.x, camera.position.y, camera.position.z,
      camera.target.x, camera.target.y, camera.target.z,
      camera.up.x, camera.up.y, camera.up.z
  );

  // 清除缓冲
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

  // 渲染场景
  glBindVertexArray(vao_);
  glDrawElements(GL_TRIANGLES, indices_.size(), GL_UNSIGNED_INT, 0);
  glBindVertexArray(0);

  // 读取深度缓冲
  depth_result.resize(width * height);
  glReadPixels(0, 0, width, height, GL_DEPTH_COMPONENT, GL_FLOAT,
               depth_result.data());

  // 归一化深度值
  for (float& d : depth_result) {
    d = min_z + d * (max_z - min_z);
  }

  return true;
}
```

### 深度图用途

```
深度图 (16x16 示例)
┌────────────────────────────────────────┐
│ 1.0 1.0 0.8 0.5 0.5 0.8 1.0 1.0 ... │  远
│ 1.0 0.8 0.3 0.2 0.2 0.3 0.8 1.0 ... │
│ 0.8 0.3 0.1 0.1 0.1 0.1 0.3 0.8 ... │  障碍物
│ 0.5 0.2 0.1 ███ ███ 0.1 0.2 0.5 ... │  (近)
│ ...                                    │
└────────────────────────────────────────┘

用途:
1. 障碍物检测 - 深度值突变表示障碍物边缘
2. 可通行性判断 - 低深度值区域为障碍
3. 掩体识别 - 局部低深度值区域
4. 视野范围计算 - 深度值范围确定可视距离
```

## 5. 射线追踪 (LineTrace)

### BVH 加速结构

```
BVH Tree (Bounding Volume Hierarchy)
              ┌─────────────────────┐
              │     Root AABB       │
              │  包围整个场景        │
              └──────────┬──────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
    ┌──────────────┐            ┌──────────────┐
    │  Left AABB   │            │  Right AABB  │
    │  场景左半部分 │            │  场景右半部分 │
    └──────┬───────┘            └──────┬───────┘
           │                           │
      ┌────┴────┐                 ┌────┴────┐
      ▼         ▼                 ▼         ▼
   [Tri1-5] [Tri6-10]         [Tri11-15] [Tri16-20]
   (叶节点)  (叶节点)          (叶节点)   (叶节点)
```

### 射线追踪实现

```
bool ObjRender::LineTrace(
    const Vector& origin,
    const Vector& direction,
    float max_distance,
    HitResult& result) {

  // 构建射线
  Ray ray;
  ray.origin = origin;
  ray.direction = glm::normalize(direction);
  ray.t_min = 0.001f;  // 避免自相交
  ray.t_max = max_distance;

  // BVH 遍历
  float closest_t = max_distance;
  bool hit = false;

  std::stack<BVHNode*> stack;
  stack.push(bvh_tree_->GetRoot());

  while (!stack.empty()) {
    BVHNode* node = stack.top();
    stack.pop();

    // AABB 相交测试
    if (!ray.IntersectsAABB(node->aabb)) {
      continue;
    }

    if (node->IsLeaf()) {
      // 测试叶节点中的三角形
      for (int i = node->first_prim; i < node->first_prim + node->prim_count; ++i) {
        float t, u, v;
        if (RayTriangleIntersect(ray, triangles_[i], t, u, v)) {
          if (t < closest_t) {
            closest_t = t;
            hit = true;
            result.point = ray.origin + ray.direction * t;
            result.distance = t;
            result.normal = triangles_[i].normal;
          }
        }
      }
    } else {
      // 递归遍历子节点
      stack.push(node->left);
      stack.push(node->right);
    }
  }

  return hit;
}
```

### 批量射线追踪

```
bool ObjRender::BatchLineTrace(
    const std::vector<Ray>& rays,
    std::vector<HitResult>& results) {

  results.resize(rays.size());

  // 并行处理多条射线
  #pragma omp parallel for
  for (size_t i = 0; i < rays.size(); ++i) {
    HitResult hit;
    if (LineTrace(rays[i].origin, rays[i].direction,
                  rays[i].t_max, hit)) {
      results[i] = hit;
    } else {
      results[i].distance = -1;  // 未命中标记
    }
  }

  return true;
}
```

## 6. OSMesa 集成

### 上下文初始化

```
bool ObjContext::Initialize(int width, int height) {
  width_ = width;
  height_ = height;

  // 创建 OSMesa 上下文
  mesa_context_ = OSMesaCreateContextExt(
      OSMESA_RGBA,   // 颜色格式
      24,            // 深度位数
      8,             // 模板位数
      0,             // 累积缓冲位数
      nullptr        // 共享上下文
  );

  if (!mesa_context_) {
    LOG_ERROR("Failed to create OSMesa context");
    return false;
  }

  // 分配帧缓冲
  frame_buffer_.resize(width * height * 4);
  depth_buffer_.resize(width * height);

  // 绑定上下文
  if (!OSMesaMakeCurrent(mesa_context_,
                         frame_buffer_.data(),
                         GL_UNSIGNED_BYTE,
                         width, height)) {
    LOG_ERROR("Failed to make OSMesa context current");
    return false;
  }

  // 初始化 OpenGL 状态
  glEnable(GL_DEPTH_TEST);
  glDepthFunc(GL_LESS);
  glClearDepth(1.0);

  return true;
}
```

### 线程安全

```
// 线程本地存储确保每个线程有独立的上下文
static thread_local std::unique_ptr<ObjContext> obj_context_;

bool ObjManager::InitializeRenderContext() {
  if (!obj_context_) {
    obj_context_ = std::make_unique<ObjContext>();
    if (!obj_context_->Initialize(DEFAULT_WIDTH, DEFAULT_HEIGHT)) {
      LOG_ERROR("Failed to initialize render context");
      return false;
    }
  }
  return true;
}
```

## 7. 模型加载

```
bool ObjRender::LoadModel(const std::string& objPath) {
  std::ifstream file(objPath);
  if (!file.is_open()) {
    LOG_ERROR("Failed to open model file: {}", objPath);
    return false;
  }

  std::string line;
  while (std::getline(file, line)) {
    std::istringstream iss(line);
    std::string prefix;
    iss >> prefix;

    if (prefix == "v") {
      // 顶点
      Vertex v;
      iss >> v.position.x >> v.position.y >> v.position.z;
      vertices_.push_back(v);
    }
    else if (prefix == "f") {
      // 面 (三角形)
      int v1, v2, v3;
      iss >> v1 >> v2 >> v3;
      indices_.push_back(v1 - 1);
      indices_.push_back(v2 - 1);
      indices_.push_back(v3 - 1);
    }
  }

  // 创建 OpenGL 缓冲
  CreateBuffers();

  // 构建 BVH
  BuildBVH();

  return true;
}
```

## 8. 与其他系统的交互

### 与特征提取系统

```
// 深度特征提取
class DepthFeature : public FeatureBase {
  bool ExtractFeatures(BaseContext* context,
                       std::vector<float>& features,
                       const std::vector<FeatureCell>& cells) override {

    // 获取深度图数据
    std::vector<float> depthData;
    context->GetTraceInfo(TraceType::TRACE_DEPTH, depthData, "depth");

    // 下采样或直接使用
    for (const auto& cell : cells) {
      for (size_t i = 0; i < cell.size_; ++i) {
        float depth = i < depthData.size() ? depthData[i] : 0.0f;
        features.push_back(depth / cell.norm_);
      }
    }

    return true;
  }
};
```

### 与规则系统

```
// 视野检查规则
class LineOfSightRule : public BaseRule {
  MatchType Match(BaseContext* ctx) override {
    auto& target = ctx->GetTarget();
    if (!target.m_player) return MatchType::NONE;

    // 执行射线追踪
    HitResult hit;
    bool blocked = ObjManager::GetInstance().LineTrace(
        ctx->BotState().m_state.m_position,
        target.m_player->m_state.m_position - ctx->BotState().m_state.m_position,
        hit
    );

    if (blocked && hit.distance < target.m_focusDist) {
      // 视线被遮挡
      return MatchType::NONE;
    }

    return MatchType::MATCH;
  }
};
```

## 9. 性能优化

### 多线程渲染

```
// 并行渲染多个代理的深度图
void RenderBatch(const std::vector<AgentInfo>& agents) {
  #pragma omp parallel for
  for (size_t i = 0; i < agents.size(); ++i) {
    // 每个线程使用独立的上下文
    ObjManager::GetInstance().InitializeRenderContext();

    std::vector<float> depth;
    ObjManager::GetInstance().Render(
        agents[i].map_id,
        agents[i].min_z, agents[i].max_z,
        agents[i].bot_info,
        depth,
        buffer_size,
        width, height
    );

    // 存储结果
    agents[i].depth_result = std::move(depth);
  }
}
```

## 10. 扩展点：添加新地图模型

```
// 1. 准备模型文件
models/
└── new_map/
    ├── map.obj        # 主模型
    ├── map.mtl        # 材质文件
    └── textures/      # 纹理目录

// 2. 注册渲染器
bool ObjManager::Initialize() {
  // ... 现有地图

  // 添加新地图
  auto newMapRender = std::make_shared<ObjRender>();
  if (newMapRender->LoadModel("models/new_map/map.obj")) {
    obj_renders_[(int)MapID::NEW_MAP] = newMapRender;
  }

  return true;
}
```
