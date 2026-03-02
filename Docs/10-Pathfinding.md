# 寻路系统设计文档

## 概述

寻路系统提供基于战略图的路径规划能力，支持DFS/BFS最短路径搜索、势力计算、区域间路径规划等功能。`StrategyGraph` 是一个单例管理器，预加载所有地图的路径数据，供运行时快速查询。

## 架构图

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
│  │  │  │ ZONE88      → Graph{路点, 邻接表, 最短路缓存}     │ │ ││
│  │  │  │ EULERBAY    → Graph{...}                        │ │ ││
│  │  │  │ BLAST_404   → Graph{...}                        │ │ ││
│  │  │  │ TC          → Graph{...}                        │ │ ││
│  │  │  │ TD_ZONE88   → Graph{...}                        │ │ ││
│  │  │  │ ...         → ...                               │ │ ││
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

## 核心类设计

### PathInfo 路径信息

```cpp
// src/core/graph/strategy_graph.h:34-44
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

```cpp
// src/core/graph/strategy_graph.h:65-155
class Graph {
 public:
  Graph() = default;
  ~Graph() = default;

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

  // 查询区域间所有路径
  std::vector<PathInfo> LookupAllRegionPath(int s, int e) {
    return m_allRegionPaths[{s, e}];
  }

  // ============ 动态路径搜索 ============

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
                    std::vector<g::Vector>& agentLocs);

  // 计算区域势力值
  void CalRegionForces(std::map<int, float>& regionForces,
                       std::map<int, float>& locHostileForces,
                       std::map<int, float>& locOurForces);

  // ============ 图结构查询 ============

  g::Vector GetLoc(int id) { return m_locations[id]; }

  std::vector<int> GetLocAdj(int locId) { return m_locAdj[locId]; }
  std::vector<int> GetRegionAdj(int regionId) { return m_regionAdj[regionId]; }
  std::vector<int> GetRegion2Loc(int regionId) { return m_region2Loc[regionId]; }
  std::vector<int> GetDirectConnectRegions(int regionId, bool reverse);

  // 获取最近路点
  std::priority_queue<std::pair<int, float>,
                      std::vector<std::pair<int, float>>, cmp>
  GetIdDist(const g::Vector& agentLoc);

 private:
  // 路点与位置
  std::unordered_map<int, g::Vector> m_locations;

  // 路点的邻接表
  std::unordered_map<int, std::vector<int>> m_locAdj;

  // 区域的邻接表
  std::unordered_map<int, std::vector<int>> m_regionAdj;

  // 区域所包含的路点
  std::unordered_map<int, std::vector<int>> m_region2Loc;

  // 路点所对应的区域
  std::unordered_map<int, int> m_loc2Region;

  // 势力传播衰减系数
  float GAMMA = 0.5;

  // 预计算的路径缓存
  std::unordered_map<std::vector<int>, std::vector<PathInfo>,
                     boost::hash<std::vector<int>>> m_allRegionPaths;
  std::unordered_map<std::vector<int>, PathInfo,
                     boost::hash<std::vector<int>>> m_allShortestLocPaths;
  std::unordered_map<std::vector<int>, PathInfo,
                     boost::hash<std::vector<int>>> m_allShortestRegionPaths;

  // 私有辅助方法
  float Distance3D(const g::Vector& t1, const g::Vector& t2);
  void PrintAllPathsUtil(...);
  void BFSShortestPathUtil(...);
  void BFSAllPathUtil(...);
  void SpreadLocForces(...);
  std::unordered_map<std::vector<int>, PathInfo, ...> CalAllShortestPaths(bool loc);
  std::unordered_map<std::vector<int>, std::vector<PathInfo>, ...> CalAllPaths(bool loc);
  std::vector<std::unordered_set<int>> BFSAllNodes(...);
  void DFSAllPathsUtil(...);
};
```

### StrategyGraph 单例

```cpp
// src/core/graph/strategy_graph.h:157-230
class StrategyGraph {
  MAKE_SINGLETON(StrategyGraph);

 public:
  std::unordered_map<int, Graph> m_mapGraph = {
    // 爆破模式地图
    {(int)PMMapID::ZONE88, Graph()},
    {(int)PMMapID::EULERBAY, Graph()},
    {(int)PMMapID::BLAST_404, Graph()},
    {(int)PMMapID::BLAST_FYZ, Graph()},
    {(int)PMMapID::BLAST_HTBWG, Graph()},
    {(int)PMMapID::BLAST_KXJQ, Graph()},
    {(int)PMMapID::BLAST_KSMT, Graph()},
    {(int)PMMapID::AKNS, Graph()},

    // 推车模式地图
    {(int)PMMapID::TC, Graph()},
    {(int)PMMapID::TCT2, Graph()},
    {(int)PMMapID::TC_SXDQ, Graph()},
    {(int)PMMapID::TC_TFLZ, Graph()},
    {(int)PMMapID::TC_ERDK, Graph()},
    {(int)PMMapID::TC_RYGC, Graph()},

    // 团竞模式地图
    {(int)PMMapID::TD_ZONE88, Graph()},
    {(int)PMMapID::TD_EULERBAY, Graph()},
    {(int)PMMapID::TD_404, Graph()},
    {(int)PMMapID::TD_FYZ, Graph()},
    {(int)PMMapID::TD_KXJQ, Graph()},
    {(int)PMMapID::TD_KSMT, Graph()},

    // 热区模式地图
    {(int)PMMapID::HT_ZONE88, Graph()},
    {(int)PMMapID::HT_FYZ, Graph()},
    {(int)PMMapID::HT_OLGK, Graph()},

    // 大头模式地图
    {(int)PMMapID::BH_ZONE88, Graph()},
    {(int)PMMapID::BH_FYZ, Graph()},
    {(int)PMMapID::BH_HTBWG, Graph()},

    // MB端地图
    // ...
  };
};
```

## 路径搜索算法

### DFS 最短路径搜索

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

```cpp
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
  int pathIndex = 0;
  float minDist = std::numeric_limits<float>::max();

  // 使用优先队列存储路径 (按节点数和距离排序)
  std::priority_queue<PathInfo, std::vector<PathInfo>, pathInfoCmp> paths;

  // 3. DFS 回溯搜索
  DFSAllPathsUtil(source, target, visited, path, pathIndex, paths,
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

```cpp
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

## 势力计算系统

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

```cpp
void Graph::CalLocForces(
    const float& minForce,
    std::map<int, float>& locForces,
    std::vector<g::Vector>& agentLocs) {

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
    g::Vector& agentLoc) {

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

```cpp
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

## 地图数据资源

### 资源文件结构

```cpp
// 每个地图的图数据存储在对应的资源文件中
// src/core/graph/resource/

// Zone88.h 示例结构
namespace Zone88 {
  // 路点位置
  const std::unordered_map<int, g::Vector> LOCATIONS = {
    {1, {1000, 2000, 100}},
    {2, {1100, 2100, 100}},
    // ...
  };

  // 路点邻接关系
  const std::unordered_map<int, std::vector<int>> LOC_ADJ = {
    {1, {2, 5, 7}},
    {2, {1, 3, 8}},
    // ...
  };

  // 区域邻接关系
  const std::unordered_map<int, std::vector<int>> REGION_ADJ = {
    {1, {2, 3}},
    {2, {1, 4}},
    // ...
  };

  // 区域包含的路点
  const std::unordered_map<int, std::vector<int>> REGION2LOC = {
    {1, {1, 2, 3}},
    {2, {4, 5, 6}},
    // ...
  };
}
```

### 支持的地图列表

| 模式 | 地图ID | 资源文件 |
|-----|--------|---------|
| 爆破 | ZONE88 | Zone88.h |
| 爆破 | EULERBAY | TDEuler.h |
| 爆破 | BLAST_404 | TD404.h |
| 爆破 | BLAST_FYZ | TDFyz.h |
| 爆破 | BLAST_HTBWG | TDHtbwg.h |
| 爆破 | BLAST_KXJQ | Kxjq.h |
| 爆破 | BLAST_KSMT | Ksmt.h |
| 爆破 | AKNS | Akns.h |
| 推车 | TC | Tc.h |
| 推车 | TCT2 | Tct2.h |
| 推车 | TC_SXDQ | Sxdq.h |
| 推车 | TC_RYGC | Rygc.h |
| 团竞 | TD_* | TD*.h |
| 热区 | HT_* | 复用爆破地图 |

## 使用示例

### 查询最短路径

```cpp
// 获取 StrategyGraph 单例
auto& sg = StrategyGraph::GetInstance();

// 获取地图对应的图
Graph& graph = sg.m_mapGraph[(int)PMMapID::ZONE88];

// 查询预计算的最短路径
std::vector<int> path = graph.LookupShortestPath(startLoc, endLoc, true);

// 遍历路径
for (int locId : path) {
  g::Vector pos = graph.GetLoc(locId);
  // 使用路点位置
}
```

### 动态路径搜索

```cpp
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

```cpp
// 收集敌人位置
std::vector<g::Vector> enemyLocs;
for (const auto& enemy : ctx->getEnemies()) {
  enemyLocs.push_back(enemy.second->m_state.m_position);
}

// 计算敌方势力
std::map<int, float> hostileForces;
graph.CalLocForces(0.01f, hostileForces, enemyLocs);

// 收集我方位置
std::vector<g::Vector> allyLocs = {myPos};
for (const auto& ally : ctx->GetAllyStates()) {
  allyLocs.push_back(ally->m_state.m_position);
}

// 计算我方势力
std::map<int, float> ourForces;
graph.CalLocForces(0.01f, ourForces, allyLocs);

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

## 扩展点

### 添加新地图

1. **创建地图资源文件**
```cpp
// src/core/graph/resource/NewMap.h
#pragma once

namespace NewMap {
  const std::unordered_map<int, g::Vector> LOCATIONS = {
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
```

2. **注册地图**
```cpp
// 在 StrategyGraph 中添加
std::unordered_map<int, Graph> m_mapGraph = {
  // ...
  {(int)PMMapID::NEW_MAP, Graph()},
};
```

3. **初始化图数据**
```cpp
// 在初始化时加载
#include "core/graph/resource/NewMap.h"

m_mapGraph[(int)PMMapID::NEW_MAP].Init(
    (int)PMMapID::NEW_MAP,
    NewMap::LOC_ADJ,
    NewMap::REGION_ADJ,
    NewMap::REGION2LOC,
    ComputeLoc2Region(NewMap::REGION2LOC)
);
```

### 自定义搜索策略

```cpp
// 实现带权重的路径搜索
PathInfo WeightedDFSSearch(
    Graph& graph,
    int source, int target,
    std::function<float(int)> weightFunc) {

  // 使用A*或加权DFS
  // ...
}
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/graph/strategy_graph.h` | StrategyGraph 和 Graph 定义 |
| `src/core/graph/strategy_graph.cc` | 实现 |
| `src/core/graph/resource/*.h` | 地图资源数据 |
