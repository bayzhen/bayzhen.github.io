# 3D渲染系统设计文档

## 概述

3D渲染系统提供离屏渲染能力，用于生成深度图和执行射线追踪(LineTrace)。系统使用OSMesa进行离屏OpenGL渲染，支持多线程并发渲染，生成的深度信息用于AI决策（如视野判断、障碍物检测）。

## 架构图

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
│  │  │  │ 1001 (ZONE88)     → ObjRender{mesh, textures}   │ │ ││
│  │  │  │ 1002 (EULERBAY)   → ObjRender{mesh, textures}   │ │ ││
│  │  │  │ ...               → ...                         │ │ ││
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

## 核心类设计

### ObjManager 单例

```cpp
// src/core/obj/obj_manager.h:15-29
namespace core::obj {

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
              const ::obj::BotInfo& bot,
              std::vector<float>& depth_result,
              int buffer_size,
              int width, int height);

  // 射线追踪
  bool LineTrace(int32_t map_id,
                 const ::obj::BotInfo& bot,
                 std::vector<float>& bot_result);

 private:
  // 线程本地存储的渲染上下文
  static thread_local std::unique_ptr<ObjContext> obj_context_;

  // 地图渲染器映射
  std::unordered_map<int32_t, std::shared_ptr<ObjRender>> obj_renders_;

  // 渲染器访问互斥锁
  std::mutex render_mutex_;
};

}  // namespace core::obj
```

### ObjContext 渲染上下文

```cpp
// src/core/obj/obj_context.h
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

```cpp
// src/core/obj/obj_render.h
class ObjRender {
 public:
  ObjRender();
  ~ObjRender();

  // 加载地图模型
  bool LoadModel(const std::string& objPath);

  // 渲染深度图
  bool RenderDepth(const CameraParams& camera,
                   float min_z, float max_z,
                   std::vector<float>& depth_result,
                   int width, int height);

  // 执行射线追踪
  bool LineTrace(const g::Vector& origin,
                 const g::Vector& direction,
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

## 深度图渲染

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

### 深度图生成

```cpp
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
    // OpenGL 深度值在 [0, 1] 范围
    // 转换为实际距离
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

## 射线追踪 (LineTrace)

### LineTrace 流程

```
LineTrace(map_id, bot, bot_result)
    │
    ├──► 构建射线参数
    │    ├── origin: bot.position
    │    ├── direction: bot.forward
    │    └── max_distance: 配置值
    │
    ├──► BVH 加速查询
    │    └── bvh_tree_->Intersect(ray)
    │
    ├──► 收集命中结果
    │    ├── hit_point: 命中位置
    │    ├── hit_distance: 距离
    │    ├── hit_normal: 表面法线
    │    └── hit_material: 材质ID
    │
    └──► 返回结果
```

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

```cpp
bool ObjRender::LineTrace(
    const g::Vector& origin,
    const g::Vector& direction,
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

```cpp
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

## OSMesa 集成

### 上下文初始化

```cpp
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

```cpp
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

## 模型加载

### OBJ 文件解析

```cpp
bool ObjRender::LoadModel(const std::string& objPath) {
  // 使用 tinyobjloader 或自定义解析器
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

### 缓冲创建

```cpp
void ObjRender::CreateBuffers() {
  glGenVertexArrays(1, &vao_);
  glGenBuffers(1, &vbo_);
  glGenBuffers(1, &ebo_);

  glBindVertexArray(vao_);

  // 顶点缓冲
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glBufferData(GL_ARRAY_BUFFER,
               vertices_.size() * sizeof(Vertex),
               vertices_.data(),
               GL_STATIC_DRAW);

  // 索引缓冲
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo_);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER,
               indices_.size() * sizeof(uint32_t),
               indices_.data(),
               GL_STATIC_DRAW);

  // 顶点属性
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                        (void*)offsetof(Vertex, position));
  glEnableVertexAttribArray(0);

  glBindVertexArray(0);
}
```

## FOV (视野) 计算

### 视野锥体

```
              近裁剪面
              ┌─────┐
             /│     │\
            / │     │ \
           /  │     │  \
          /   │     │   \
         /    └─────┘    \
        /                  \
       /     FOV角度        \
      /         ▲           \
     /          │            \
    /           │             \
   /            │ 视线         \
  ──────────────●──────────────
              相机位置

FOV = 2 × arctan(高度/2 / 焦距)
```

### FOV 可见性检查

```cpp
bool IsInFOV(const CameraParams& camera,
             const g::Vector& point,
             float fov_degrees) {

  // 计算相机到目标的方向
  g::Vector to_point = point - camera.position;
  to_point = glm::normalize(to_point);

  // 计算与视线的夹角
  float dot = glm::dot(camera.forward, to_point);
  float angle = std::acos(dot) * 180.0f / M_PI;

  // 检查是否在 FOV 内
  return angle <= fov_degrees / 2.0f;
}
```

## 与其他系统的交互

### 与特征提取系统

```cpp
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

```cpp
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

## 扩展点

### 添加新地图模型

1. **准备模型文件**
```
models/
└── new_map/
    ├── map.obj        # 主模型
    ├── map.mtl        # 材质文件
    └── textures/      # 纹理目录
```

2. **注册渲染器**
```cpp
bool ObjManager::Initialize() {
  // ... 现有地图

  // 添加新地图
  auto newMapRender = std::make_shared<ObjRender>();
  if (newMapRender->LoadModel("models/new_map/map.obj")) {
    obj_renders_[(int)PMMapID::NEW_MAP] = newMapRender;
  }

  return true;
}
```

### 自定义渲染模式

```cpp
// 添加法线图渲染
bool ObjRender::RenderNormals(
    const CameraParams& camera,
    std::vector<float>& normal_result,
    int width, int height) {

  // 使用法线可视化着色器
  glUseProgram(normal_shader_);

  // ... 渲染流程

  return true;
}
```

## 性能优化

### 多线程渲染

```cpp
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

### 渲染缓存

```cpp
// 缓存不变的渲染结果
class RenderCache {
  std::unordered_map<CacheKey, std::vector<float>> cache_;

  bool GetCached(const CacheKey& key, std::vector<float>& result) {
    auto it = cache_.find(key);
    if (it != cache_.end()) {
      result = it->second;
      return true;
    }
    return false;
  }

  void Store(const CacheKey& key, const std::vector<float>& result) {
    cache_[key] = result;
  }
};
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/obj/obj_manager.h` | ObjManager 定义 |
| `src/core/obj/obj_manager.cc` | ObjManager 实现 |
| `src/core/obj/obj_context.h` | ObjContext 定义 |
| `src/core/obj/obj_context.cc` | ObjContext 实现 |
| `src/core/obj/obj_render.h` | ObjRender 定义 |
| `src/core/obj/obj_render.cc` | ObjRender 实现 |
| `models/` | 地图模型文件 |
