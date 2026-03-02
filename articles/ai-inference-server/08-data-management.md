---
layout: article
title: "数据管理系统"
description: "地图资源、战略点位、空间索引、角色技能配置"
level: intermediate
tags: ["数据管理", "空间索引"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 8
prev:
  title: "上下文系统"
  url: "07-context-system.html"
next:
  title: "特征提取系统"
  url: "09-feature-extraction.html"
---

## 1. 概述

数据管理系统负责加载、存储和提供游戏资源数据，包括地图信息、战略点位、掩体位置、补给点、技能配置等。`DataManager` 是一个单例管理器，在服务启动时加载所有静态数据，供运行时快速查询。

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        DataManager                               │
│                     (Singleton Pattern)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GlobalInfo                            │   │
│  │    全局配置信息 (技能ID、角色ID映射等)                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ProjectInfo                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           m_mapResource[mapId]                  │    │   │
│  │  │  ┌─────────────────────────────────────────┐   │    │   │
│  │  │  │  ResourceInfo                           │   │    │   │
│  │  │  │  ├── StrategyData (战略数据)             │   │    │   │
│  │  │  │  ├── CoverPoints (掩体点)               │   │    │   │
│  │  │  │  ├── AmbushPoints (埋伏点)              │   │    │   │
│  │  │  │  ├── Supplies (补给点)                  │   │    │   │
│  │  │  │  └── Lineups (技能配置)                 │   │    │   │
│  │  │  └─────────────────────────────────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 数据来源
                              ▼
         ┌────────────────────────────────────────┐
         │              YAML 配置文件              │
         │  ┌────────────────────────────────┐   │
         │  │ config/data/map_*.yaml         │   │
         │  │ config/data/lineups/*.yaml     │   │
         │  │ config/data/regions.csv        │   │
         │  └────────────────────────────────┘   │
         └────────────────────────────────────────┘
```

## 3. 核心数据类型

```
// 位置信息
struct LocationInfo {
  int m_id;                    // 点位ID
  Vector m_position;           // 3D位置坐标
  float m_angle;               // 朝向角度
  int m_type;                  // 点位类型
  std::vector<int> m_links;    // 连接的其他点位
};

// 掩体点
struct CoverPoint {
  int m_id;                    // 掩体ID
  Vector m_position;           // 位置
  float m_angle;               // 最佳朝向
  int m_coverType;             // 掩体类型 (全掩体/半掩体)
  bool m_isLowCover;           // 是否为低矮掩体
  Vector m_peekLeft;           // 左探头位置
  Vector m_peekRight;          // 右探头位置
};

// 埋伏点
struct AmbushPoint {
  int m_id;
  Vector m_position;           // 埋伏位置
  Vector m_watchDirection;     // 观察方向
  float m_angle;
  int m_priority;              // 优先级
};

// 父子点位信息 (用于技能配置)
struct ParentChildInfo {
  int m_parentId;              // 父点位ID (投掷位置)
  int m_childId;               // 子点位ID (目标位置)
  Vector m_parentPos;          // 投掷位置坐标
  Vector m_childPos;           // 目标位置坐标
  float m_angle;               // 投掷角度
  int m_skill;                 // 技能ID
};

// 网格索引键
struct GridKey {
  int x;
  int y;
  int z;

  struct Hash {
    size_t operator()(const GridKey& key) const {
      return std::hash<int>()(key.x) ^
             (std::hash<int>()(key.y) << 1) ^
             (std::hash<int>()(key.z) << 2);
    }
  };
};
```

## 4. 数据加载流程

```
Initialize()
    │
    ├──► 加载全局配置
    │    └── ParseGlobalInfo()
    │
    ├──► 遍历地图配置
    │    │
    │    ├──► ParseSupplyInfo()      # 补给点
    │    ├──► ParseCoverPointInfo()  # 掩体点
    │    ├──► ParseAmbushPointInfo() # 埋伏点
    │    ├──► ParseStrategyData()    # 战略数据
    │    ├──► ParseThrownInfo()      # 投掷物配置
    │    ├──► ParseFireBaseInfo()    # 射击点位
    │    └──► ParsePairPointsInfo()  # 技能配置
    │
    ├──► 加载角色特定配置
    │    ├──► GetCharacterQLineups()
    │    ├──► GetCharacterCLineups()
    │    └──► ...
    │
    └──► 构建空间索引
         └── BuildPoint2CoverIndex()
```

## 5. 空间索引系统

```
地图空间
┌─────────────────────────────────────┐
│ ┌───┬───┬───┬───┬───┬───┬───┬───┐ │
│ │0,0│1,0│2,0│3,0│4,0│5,0│6,0│7,0│ │
│ ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│ │0,1│1,1│ C │ C │4,1│5,1│6,1│7,1│ │  C = 掩体点
│ ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│ │0,2│1,2│2,2│3,2│4,2│ C │6,2│7,2│ │
│ ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│ │0,3│1,3│2,3│3,3│4,3│5,3│6,3│7,3│ │
│ └───┴───┴───┴───┴───┴───┴───┴───┘ │
└─────────────────────────────────────┘

查询 GridKey(2,1) → 返回 [CoverIndex_1, CoverIndex_2]
查询 GridKey(5,2) → 返回 [CoverIndex_3]

// 获取位置对应的掩体索引
std::unordered_map<GridKey, std::vector<uint16_t>, GridKey::Hash>
GetPoint2Covers(int map_id);

// 根据位置查询附近掩体
bool GetCoverIndexesByPoint(const int& mapID, const Vector& pos,
                            std::vector<uint16_t>& covers);
```

## 6. 使用示例

```
// 获取补给点
const std::vector<LocationInfo>& supplies = DATA_MANAGER()->GetSupplys(mapId);

for (const auto& supply : supplies) {
  float dist = D3D(myPos, supply.m_position);
  if (dist < 500.0f) {
    // 发现附近补给点
  }
}

// 获取掩体点
const std::vector<CoverPoint>& covers = DATA_MANAGER()->GetCoverPoints(mapId);

// 或通过空间索引快速查询
std::vector<uint16_t> nearbyCovers;
if (DATA_MANAGER()->GetCoverIndexesByPoint(mapId, myPos, nearbyCovers)) {
  for (auto idx : nearbyCovers) {
    const CoverPoint& cover = covers[idx];
    // 使用掩体点
  }
}

// 获取技能配置
auto& qLineups = DATA_MANAGER()->GetCharacterQLineups(mapId);

for (const auto& lineup : qLineups) {
  float distToParent = D3D(myPos, lineup.m_parentPos);
  if (distToParent < 200.0f) {
    // 在投掷位置附近，可以使用此配置
    Vector target = lineup.m_childPos;
    float angle = lineup.m_angle;
    // 执行投掷
  }
}
```

## 7. 技能配置文件示例

```
# config/data/lineups/character_q_lineups.yaml
lineups:
  - map_id: 1001
    points:
      - parent_id: 1
        child_id: 101
        parent_pos: [1234.5, 567.8, 100.0]
        child_pos: [1300.0, 600.0, 95.0]
        angle: 45.0
        skill: 1
      - parent_id: 2
        child_id: 102
        parent_pos: [1500.0, 700.0, 105.0]
        child_pos: [1600.0, 750.0, 100.0]
        angle: 30.0
        skill: 1
```

## 8. 扩展点：添加新地图数据

```
# 1. 创建地图配置文件 config/data/map_9999.yaml
map_id: 9999
name: "新地图"

supplies:
  - id: 1
    position: [1000, 2000, 100]
    angle: 0
    type: 1

covers:
  - id: 1
    position: [1100, 2100, 100]
    angle: 45
    cover_type: 1
    is_low: false

ambush_points:
  - id: 1
    position: [1200, 2200, 100]
    watch_direction: [0, 1, 0]
    priority: 10

# 2. 注册地图ID
bool DataManager::IsLegalMapID(const int mapID) {
  return m_projectInfo.m_mapResource.count(mapID) > 0;
}
```
