---
layout: article
title: "寻路系统"
description: "战略图路径规划、DFS/BFS搜索、势力计算"
level: advanced
tags: ["寻路", "图算法"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 10
prev:
  title: "特征提取系统"
  url: "09-feature-extraction.html"
next:
  title: "3D渲染系统"
  url: "11-3d-rendering.html"
---

## 1. 概述

寻路系统提供基于战略图的路径规划能力，支持DFS/BFS最短路径搜索、势力计算、区域间路径规划等功能。`StrategyGraph` 是一个单例管理器，预加载所有地图的路径数据，供运行时快速查询。

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                       StrategyGraph                              │
│                     (Singleton Pattern)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │         m_mapGraph: unordered_map<int, Graph>               ││
│  │  ┌───────────────────────────────────────────────────────┐ ││
│  │  │  MapID → Graph                                        │ ││
│  │  │  ┌─────────────────────────────────────────────────┐ │ ││
│  │  │  │ MAP_A   → Graph{路点, 邻接表, 最短路缓存}        │ │ ││
│  │  │  │ MAP_B   → Graph{...}                            │ │ ││
│  │  │  │ MAP_C   → Graph{...}                            │ │ ││
│  │  │  │ ...     → ...                                   │ │ ││
│  │  │  └─────────────────────────────────────────────────┘ │ ││
│  │  └───────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 查询
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Graph                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ m_locations      - 路点位置映射                          │   │
│  │ m_locAdj         - 路点邻接表                            │   │
│  │ m_regionAdj      - 区域邻接表                            │   │
│  │ m_region2Loc     - 区域到路点映射                        │   │
│  │ m_loc2Region     - 路点到区域映射                        │   │
│  │ m_allShortestLocPaths   - 路点最短路缓存                 │   │
│  │ m_allShortestRegionPaths - 区域最短路缓存                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. 核心数据结构

### PathInfo 路径信息

```
class PathInfo {
 public:
  PathInfo() : m_dist(0), m_nodeNum(0) {}

  std::vector<int> m_path;    // 路径节点序列
  float m_dist = 0;           // 路径总距离
  int m_nodeNum = 0;          // 节点数量
  int m_start = 0;            // 起点ID
  int m_end = 0;              // 终点ID
  float m_calTime = 0;        // 计算耗时
};
```

### Graph 类

```
class Graph {
 public:
  // 初始化图
  void Init(const int mapId,
            std::unordered_map<int, std::vector<int>> locAdj,
            std::unordered_map<int, std::vector<int>> regionAdj,
            std::unordered_map<int, std::vector<int>> region2Loc,
            std::unordered_map<int, int> loc2Region);

  // ============ 路径查询 ============

  // 查询预计算的最短路
  std::vector<int> LookupShortestPath(int s, int e, bool loc) {
    if (loc) return m_allShortestLocPaths[{s, e}].m_path;
    return m_allShortestRegionPaths[{s, e}].m_path;
  }

  // DFS 搜索所有可能路径
  std::vector<PathInfo> DFSAllPaths(int source, int target,
                                     std::vector<int> goodRegions,
                                     std::unordered_set<int> badRegions,
                                     std::unordered_set<int> badLocs,
                                     bool locPath,
                                     const int& maxSize);

  // DFS 搜索最短路
  PathInfo DFSShortestPath(int source, int target,
                           std::vector<int> goodRegions,
                           std::unordered_set<int> badRegions,
                           std::unordered_set<int> badLocs,
                           bool locPath);

  // ============ 势力计算 ============

  // 计算各路点的势力值
  void CalLocForces(const float& minForce,
                    std::map<int, float>& locForces,
                    std::vector<Vector>& agentLocs);

  // 计算区域势力值
  void CalRegionForces(std::map<int, float>& regionForces,
                       std::map<int, float>& locHostileForces,
                       std::map<int, float>& locOurForces);

 private:
  std::unordered_map<int, Vector> m_locations;
  std::unordered_map<int, std::vector<int>> m_locAdj;
  std::unordered_map<int, std::vector<int>> m_regionAdj;
  std::unordered_map<int, std::vector<int>> m_region2Loc;
  std::unordered_map<int, int> m_loc2Region;
  float GAMMA = 0.5;  // 势力传播衰减系数
};
```

## 4. 路径搜索算法

### DFS 最短路径搜索流程

```
DFSShortestPath(source, target, goodRegions, badRegions, badLocs, locPath)
    │
    ├──► BFSAllNodes(source, target, ...)
    │    构建分层的可达节点集合
    │
    ├──► DFSAllPathsUtil(...)
    │    在可达节点中进行DFS回溯搜索
    │
    └──► 返回最短路径
```

### DFS 搜索实现

```
std::vector<PathInfo> Graph::DFSAllPaths(
    int source, int target,
    std::vector<int> goodRegions,
    std::unordered_set<int> badRegions,
    std::unordered_set<int> badLocs,
    bool locPath,
    const int& maxSize) {

  // 1. BFS 构建可达节点的分层结构
  std::vector<std::unordered_set<int>> allNodes =
      BFSAllNodes(source, target, goodRegions, badRegions, badLocs, locPath);

  if (allNodes.empty()) {
    return {};  // 无法到达
  }

  // 2. 初始化搜索状态
  std::unordered_set<int> visited;
  std::vector<int> path;
  float minDist = std::numeric_limits<float>::max();

  // 使用优先队列存储路径 (按节点数和距离排序)
  std::priority_queue<PathInfo, std::vector<PathInfo>, pathInfoCmp> paths;

  // 3. DFS 回溯搜索
  DFSAllPathsUtil(source, target, visited, path, 0, paths,
                  allNodes, 0, locPath, maxSize, minDist);

  // 4. 转换为向量返回
  std::vector<PathInfo> result;
  while (!paths.empty()) {
    result.push_back(paths.top());
    paths.pop();
  }
  return result;
}
```

### BFS 分层节点构建

```
std::vector<std::unordered_set<int>> Graph::BFSAllNodes(
    int source, int target,
    const std::vector<int>& goodRegions,
    const std::unordered_set<int>& badRegions,
    const std::unordered_set<int>& badLocs,
    const bool& locPath) {

  std::vector<std::unordered_set<int>> allNodes;
  allNodes.push_back({source});

  int depth = 0;
  const int maxDepth = 20;  // 防止无限循环

  while (depth < maxDepth) {
    std::unordered_set<int> nextLayer;

    for (int node : allNodes[depth]) {
      std::vector<int> neighbors = locPath ?
          m_locAdj[node] : m_regionAdj[node];

      for (int next : neighbors) {
        // 检查是否为禁止区域/路点
        if (locPath && badLocs.count(next)) continue;
        if (!locPath && badRegions.count(next)) continue;

        // 检查是否已访问
        bool visited = false;
        for (const auto& layer : allNodes) {
          if (layer.count(next)) {
            visited = true;
            break;
          }
        }
        if (!visited) {
          nextLayer.insert(next);
        }
      }
    }

    if (nextLayer.empty()) break;
    allNodes.push_back(nextLayer);

    // 找到目标
    if (nextLayer.count(target)) break;

    depth++;
  }

  return allNodes;
}
```

## 5. 势力计算系统

### 势力传播原理

```
敌人位置 P_enemy
    │
    ▼
┌───────────────────────────────────────────────┐
│          势力扩散 (按距离衰减)                  │
│                                                │
│   势力值 = 初始势力 × γ^(跳数)                  │
│                                                │
│   γ = 0.5 (衰减系数)                           │
│                                                │
│        [P_enemy]                               │
│        力=1.0                                  │
│           │                                    │
│     ┌─────┼─────┐                             │
│     ▼     ▼     ▼                             │
│   [N1]  [N2]  [N3]                            │
│   力=0.5 力=0.5 力=0.5                         │
│     │     │     │                              │
│   ┌─┴─┐ ┌─┴─┐ ┌─┴─┐                          │
│   ▼   ▼ ▼   ▼ ▼   ▼                          │
│  [..] [..] [...] [..] [..]                    │
│  力=0.25  力=0.25  力=0.25                     │
│                                                │
└───────────────────────────────────────────────┘
```

### 势力计算实现

```
void Graph::CalLocForces(
    const float& minForce,
    std::map<int, float>& locForces,
    std::vector<Vector>& agentLocs) {

  for (const auto& agentLoc : agentLocs) {
    // 找到最近的路点
    auto idDist = GetIdDist(agentLoc);
    if (idDist.empty()) continue;

    int nearestLoc = idDist.top().first;
    std::map<int, float> oneLocForces;

    // 从该路点开始传播势力
    SpreadLocForces(minForce, oneLocForces, agentLoc);

    // 累加到总势力
    for (const auto& [locId, force] : oneLocForces) {
      locForces[locId] += force;
    }
  }
}

void Graph::SpreadLocForces(
    const float& minForce,
    std::map<int, float>& locForces,
    Vector& agentLoc) {

  // BFS 传播
  std::queue<std::pair<int, int>> bfsQueue;  // <节点ID, 跳数>
  std::unordered_set<int> visited;

  // 找到起始点
  auto idDist = GetIdDist(agentLoc);
  int startLoc = idDist.top().first;

  bfsQueue.push({startLoc, 0});
  visited.insert(startLoc);

  while (!bfsQueue.empty()) {
    auto [locId, hops] = bfsQueue.front();
    bfsQueue.pop();

    // 计算势力值
    float force = std::pow(GAMMA, hops);
    if (force < minForce) continue;

    locForces[locId] = force;

    // 传播到邻居
    for (int neighbor : m_locAdj[locId]) {
      if (!visited.count(neighbor)) {
        visited.insert(neighbor);
        bfsQueue.push({neighbor, hops + 1});
      }
    }
  }
}
```

### 区域势力计算

```
void Graph::CalRegionForces(
    std::map<int, float>& regionForces,
    std::map<int, float>& locHostileForces,
    std::map<int, float>& locOurForces) {

  // 遍历所有区域
  for (const auto& [regionId, locs] : m_region2Loc) {
    float hostileSum = 0;
    float ourSum = 0;

    // 累加区域内所有路点的势力
    for (int locId : locs) {
      hostileSum += locHostileForces[locId];
      ourSum += locOurForces[locId];
    }

    // 计算区域控制度
    // 正值表示敌方控制，负值表示我方控制
    regionForces[regionId] = hostileSum - ourSum;
  }
}
```

## 6. 使用示例

### 查询最短路径

```
// 获取 StrategyGraph 单例
auto& sg = StrategyGraph::GetInstance();

// 获取地图对应的图
Graph& graph = sg.m_mapGraph[mapId];

// 查询预计算的最短路径
std::vector<int> path = graph.LookupShortestPath(startLoc, endLoc, true);

// 遍历路径
for (int locId : path) {
  Vector pos = graph.GetLoc(locId);
  // 使用路点位置
}
```

### 动态路径搜索

```
// 设置搜索约束
std::vector<int> goodRegions = {1, 2, 3};  // 优先区域
std::unordered_set<int> badRegions = {5, 6};  // 避开区域
std::unordered_set<int> badLocs = {10, 11, 12};  // 避开路点

// DFS 搜索最短路
PathInfo shortestPath = graph.DFSShortestPath(
    startLoc, endLoc,
    goodRegions, badRegions, badLocs,
    true,  // locPath = true 表示路点级别
    10     // 最大返回路径数
);

// 使用结果
if (!shortestPath.m_path.empty()) {
  for (int locId : shortestPath.m_path) {
    // 移动到路点
  }
}
```

### 势力评估

```
// 收集敌人位置
std::vector<Vector> enemyLocs;
for (const auto& enemy : ctx->getEnemies()) {
  enemyLocs.push_back(enemy.second->m_state.m_position);
}

// 计算敌方势力
std::map<int, float> hostileForces;
graph.CalLocForces(0.01f, hostileForces, enemyLocs);

// 计算区域控制度
std::map<int, float> regionForces;
graph.CalRegionForces(regionForces, hostileForces, ourForces);

// 选择安全区域 (我方控制的)
for (const auto& [regionId, force] : regionForces) {
  if (force < 0) {  // 负值表示我方控制
    // 该区域相对安全
  }
}
```

## 7. 扩展点：添加新地图

```
// 1. 创建地图资源文件
namespace NewMap {
  const std::unordered_map<int, Vector> LOCATIONS = {
    {1, {x1, y1, z1}},
    {2, {x2, y2, z2}},
    // ...
  };

  const std::unordered_map<int, std::vector<int>> LOC_ADJ = {
    {1, {2, 3}},
    // ...
  };

  const std::unordered_map<int, std::vector<int>> REGION_ADJ = {
    {1, {2}},
    // ...
  };

  const std::unordered_map<int, std::vector<int>> REGION2LOC = {
    {1, {1, 2, 3}},
    // ...
  };
}

// 2. 注册地图
std::unordered_map<int, Graph> m_mapGraph = {
  // ...
  {(int)MapID::NEW_MAP, Graph()},
};

// 3. 初始化图数据
m_mapGraph[(int)MapID::NEW_MAP].Init(
    (int)MapID::NEW_MAP,
    NewMap::LOC_ADJ,
    NewMap::REGION_ADJ,
    NewMap::REGION2LOC,
    ComputeLoc2Region(NewMap::REGION2LOC)
);
```
