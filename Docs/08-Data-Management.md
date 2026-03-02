# 数据管理系统设计文档

## 概述

数据管理系统负责加载、存储和提供游戏资源数据，包括地图信息、战略点位、掩体位置、补给点、技能配置等。`DataManager` 是一个单例管理器，在服务启动时加载所有静态数据，供运行时快速查询。

## 架构图

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
│  │  │  │  ├── Lineups (技能配置)                 │   │    │   │
│  │  │  │  └── ...                                │   │    │   │
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
         │  │ config/data/crack_regions.csv  │   │
         │  └────────────────────────────────┘   │
         └────────────────────────────────────────┘
```

## 核心类设计

### DataManager 单例

```cpp
// src/core/data/data_manager.h:19-196
class DataManager {
  MAKE_SINGLETON(DataManager)

 public:
  bool Initialize();

  GlobalInfo m_globalInfo;
  ProjectInfo m_projectInfo;

  // ============ 地图验证 ============
  bool IsLegalMapID(const int mapID);

  // ============ 补给点 ============
  const std::vector<LocationInfo>& GetSupplys(const int mapID);
  const std::vector<LocationInfo>& GetFreezeSupplies(const int mapID, const int camp);
  const std::vector<LocationInfo>& GetAttackerSupplies(const int mapID, const int path);
  const std::vector<LocationInfo>& GetDefenderSupplies(const int mapID, const int path);
  const std::vector<LocationInfo>& GetTeamDeathSupplys(const int mapID);

  // ============ 战略数据 ============
  StrategyDataPtr GetStrategyData(const int mapID);
  const std::vector<CrackRegion>& GetCrackRegions(int mapId) const;

  // ============ 掩体/埋伏点 ============
  const std::vector<CoverPoint>& GetCoverPoints(const int mapID);
  const std::vector<AmbushPoint>& GetAmbushPoints(const int mapID);

  // ============ 投掷物配置 ============
  const std::vector<g::Vector>& GetTargetPoints(const int mapID);
  const std::vector<std::vector<g::Vector>>& GetThrowPoints(const int mapID);

  // ============ 射击点位 ============
  const std::vector<g::Vector>& GetFireLocs(const int mapID);
  std::vector<std::vector<g::Vector>>& GetAimPoints(const int mapID);

  // ============ 角色技能配置 ============
  std::vector<ParentChildInfo>& GetMiXueErQLineups(const int mapID);
  std::vector<ParentChildInfo>& GetMiXueErXLineups(const int mapID);
  std::vector<ParentChildInfo>& GetMiXueErCLineups(const int mapID);
  std::vector<ParentChildInfo>& GetXinChangQLineups(const int mapID);
  std::vector<ParentChildInfo>& GetLaWeiLineups(const int mapID);
  std::vector<ParentChildInfo>& GetGalatiaLineups(const int mapID);
  // ... 更多角色配置

  // ============ 区域信息 ============
  const std::vector<ArenaInfo>& GetAreaInfos(const int mapID);
  std::map<int, std::vector<SPointDataPtr>>& GetBombArea(const int mapID);
  std::vector<PolygonPrism>& GetClosedRegions(const int mapID, const int type);

  // ============ 网格索引 ============
  std::unordered_map<GridKey, std::vector<uint16_t>, GridKey::Hash> GetPoint2Covers(int map_id);
  bool GetCoverIndexesByPoint(const int& mapID, const g::Vector& pos,
                              std::vector<uint16_t>& covers);

  // ============ 出生点 ============
  const g::Vector* GetBirthLocation(const int mapID, const int camp);
  std::vector<PolygonPrism>& GetAttackerBirthRegions(const int mapID, const int type);
  std::vector<PolygonPrism>& GetDefenderBirthRegions(const int mapID, const int type);
};

#define DATA_MANAGER() (e::DataManager::GetInstance())
```

### BuildDataManagerGetter 宏

```cpp
// 自动生成地图资源的 getter 方法
#define BuildDataManagerGetter(name, ...)                     \
 public:                                                      \
  const __VA_ARGS__& get_##name(const int mapID) {           \
    return m_projectInfo.m_mapResource[mapID]->name;         \
  }

// 使用示例
BuildDataManagerGetter(battle_pre_aim_point_, std::vector<LocationInfo>);
BuildDataManagerGetter(cs_route_, std::vector<LocationInfo>);
BuildDataManagerGetter(cover_view_, std::vector<LocationInfo>);
BuildDataManagerGetter(conceal_points_, std::vector<LocationInfo>);
// ... 更多自动生成的 getter
```

## 核心数据类型

### LocationInfo - 位置信息

```cpp
struct LocationInfo {
  int m_id;                    // 点位ID
  g::Vector m_position;        // 3D位置坐标
  float m_angle;               // 朝向角度
  int m_type;                  // 点位类型
  std::vector<int> m_links;    // 连接的其他点位

  std::string toString() const;
};
```

### CoverPoint - 掩体点

```cpp
struct CoverPoint {
  int m_id;                    // 掩体ID
  g::Vector m_position;        // 位置
  float m_angle;               // 最佳朝向
  int m_coverType;             // 掩体类型 (全掩体/半掩体)
  bool m_isLowCover;           // 是否为低矮掩体
  g::Vector m_peekLeft;        // 左探头位置
  g::Vector m_peekRight;       // 右探头位置
};
```

### AmbushPoint - 埋伏点

```cpp
struct AmbushPoint {
  int m_id;
  g::Vector m_position;        // 埋伏位置
  g::Vector m_watchDirection;  // 观察方向
  float m_angle;
  int m_priority;              // 优先级
};
```

### StrategyData - 战略数据

```cpp
struct StrategyData {
  int m_mapId;
  std::vector<LocationInfo> m_keyPoints;     // 关键点位
  std::vector<LocationInfo> m_routePoints;   // 路线点
  std::map<int, int> m_pointConnections;     // 点位连接关系

  // 区域划分
  std::vector<AreaInfo> m_areas;
};

using StrategyDataPtr = std::shared_ptr<StrategyData>;
```

### ParentChildInfo - 父子点位信息

```cpp
// 用于技能配置 (投掷位置 -> 目标位置)
struct ParentChildInfo {
  int m_parentId;              // 父点位ID (投掷位置)
  int m_childId;               // 子点位ID (目标位置)
  g::Vector m_parentPos;       // 投掷位置坐标
  g::Vector m_childPos;        // 目标位置坐标
  float m_angle;               // 投掷角度
  int m_skill;                 // 技能ID
  int m_actorId;               // 角色ID
};
```

### CrackRegion - 破裂区域

```cpp
struct CrackRegion {
  int m_id;
  int m_mapId;
  g::Vector m_center;          // 中心点
  float m_radius;              // 半径
  int m_health;                // 生命值
  bool m_isDestroyed;          // 是否已破坏
};
```

### GridKey - 网格索引键

```cpp
struct GridKey {
  int x;
  int y;
  int z;

  bool operator==(const GridKey& other) const {
    return x == other.x && y == other.y && z == other.z;
  }

  struct Hash {
    size_t operator()(const GridKey& key) const {
      return std::hash<int>()(key.x) ^
             (std::hash<int>()(key.y) << 1) ^
             (std::hash<int>()(key.z) << 2);
    }
  };
};
```

## 数据加载流程

### 初始化流程

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
    │    ├──► GetMiXueErQLineups()
    │    ├──► GetXinChangQLineups()
    │    └──► ...
    │
    └──► 构建空间索引
         └── BuildPoint2CoverIndex()
```

### YAML 解析方法

```cpp
// 通用解析模板
template <typename T>
void TryParse(std::string key, const YAML::Node& node, T& out) {
  if (node[key].IsDefined())
    out = node[key].as<T>();
}

// 位置信息解析
void ParseLocationInfo(std::string nodeName,
                       std::vector<LocationInfo>& result,
                       const YAML::Node& supplyNode);

// 补给点解析
void ParseSupplyInfo(const YAML::Node& config,
                     std::vector<LocationInfo>& result);

// 掩体点解析
void ParseCoverPointInfo(const YAML::Node& config,
                         int mapId,
                         ResourceInfoPtr& resourceInfoPtr);

// 战略数据解析
void ParseStrategyData(const YAML::Node& config,
                       StrategyDataPtr result);

// 父子点位解析 (技能配置)
void ParsePairPointsInfo(const YAML::Node& config,
                         int mapID,
                         std::vector<ParentChildInfo>& result,
                         bool filter = false,
                         int fType = 0);

// CSV 解析 (破裂区域)
void ParseCrackRegionsFromCsv(const std::string& filepath);
```

## 空间索引系统

### Point2Cover 索引

```cpp
// 获取位置对应的掩体索引
std::unordered_map<GridKey, std::vector<uint16_t>, GridKey::Hash>
GetPoint2Covers(int map_id);

// 根据位置查询附近掩体
bool GetCoverIndexesByPoint(const int& mapID,
                            const g::Vector& pos,
                            std::vector<uint16_t>& covers);
```

### 网格化原理

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
```

## 角色技能配置

### 配置数据获取

```cpp
// 米雪儿技能配置
std::vector<ParentChildInfo>& GetMiXueErQLineups(const int mapID);
std::vector<ParentChildInfo>& GetMiXueErXLineups(const int mapID);
std::vector<ParentChildInfo>& GetMiXueErCLineups(const int mapID);

// 朱利安技能配置
std::vector<ParentChildInfo>& GetZhuLiAnQLineups(const int mapID);

// 拉薇技能配置
std::vector<ParentChildInfo>& GetLaWeiLineups(const int mapID);
std::vector<ParentChildInfo>& GetLaWeiCLineups(const int mapID);
std::vector<ParentChildInfo>& GetLaWeiXLineups(const int mapID);

// 心昌技能配置
std::vector<ParentChildInfo>& GetXinChangQLineups(const int mapID);
std::vector<ParentChildInfo>& GetXinChangXLineups(const int mapID);

// 加拉提亚技能配置 (雪球)
std::vector<ParentChildInfo>& GetGalatiaLineups(const int mapID);
std::vector<ParentChildInfo>& GetSnowBallLineups(const int mapID);

// 马德莱娜技能配置
std::vector<ParentChildInfo>& GetMaDeLeiNaDefendQLineups(const int mapID);
std::vector<ParentChildInfo>& GetMaDeLeiNaAttackXLineups(const int mapID);
std::vector<ParentChildInfo>& GetMaDeLeiNaDefendCLineups(const int mapID);

// 梅瑞迪斯技能配置
std::vector<ParentChildInfo>& GetMeiRuiDiSiLineups(const int mapID);
std::vector<ParentChildInfo>& GetMeiRuiDiSiCLineups(const int mapID);
std::vector<ParentChildInfo>& GetMeiRuiDiSiAttackXLineups(const int mapID);

// 蕾欧娜技能配置
std::vector<ParentChildInfo>& GetLeiounaCube(const int mapID);

// 伊薇特技能配置
std::vector<ParentChildInfo>& GetYiWeiTeQSupplies(const int mapID);
std::vector<ParentChildInfo>& GetYiWeiTeQLocs(const int mapID);
std::vector<SinglePointInfo>& GetYiWeiTeQHideLocs(const int mapID);

// 通用手雷配置
std::vector<ParentChildInfo>& GetGrenadeLineups(const int mapID);
std::vector<ParentChildInfo>& GetConcealGrenadeLineups(const int mapID);
```

### 技能配置文件示例

```yaml
# config/data/lineups/mixueer_q_lineups.yaml
lineups:
  - map_id: 1001
    points:
      - parent_id: 1
        child_id: 101
        parent_pos: [1234.5, 567.8, 100.0]
        child_pos: [1300.0, 600.0, 95.0]
        angle: 45.0
        skill: 1
        actor_id: 10
      - parent_id: 2
        child_id: 102
        parent_pos: [1500.0, 700.0, 105.0]
        child_pos: [1600.0, 750.0, 100.0]
        angle: 30.0
        skill: 1
        actor_id: 10
```

## 地图资源结构

### 支持的地图

```cpp
enum class PMMapID {
  // 爆破模式地图
  ZONE88 = 1001,
  EULERBAY = 1002,
  BLAST_404 = 1003,
  BLAST_FYZ = 1004,
  BLAST_HTBWG = 1005,
  BLAST_KXJQ = 1006,
  BLAST_KSMT = 1007,
  AKNS = 1008,

  // 推车模式地图
  TC = 2001,
  TCT2 = 2002,
  TC_SXDQ = 2003,
  TC_RYGC = 2004,

  // 团竞模式地图
  TD_ZONE88 = 3001,
  TD_EULERBAY = 3002,
  TD_404 = 3003,
  TD_FYZ = 3004,
  TD_KXJQ = 3005,
  TD_KSMT = 3006,

  // 热区模式地图
  HT_ZONE88 = 4001,
  HT_FYZ = 4002,
  HT_OLGK = 4003,

  // 大头模式地图
  BH_ZONE88 = 5001,
  BH_FYZ = 5002,
  BH_HTBWG = 5003,

  // ... 更多地图
};
```

### 资源文件路径

```
config/data/
├── map_1001.yaml          # Zone88 爆破模式
├── map_1002.yaml          # Eulerbay 爆破模式
├── map_2001.yaml          # 推车模式
├── map_3001.yaml          # 团竞模式
├── crack_regions.csv      # 破裂区域数据
└── lineups/
    ├── mixueer_q.yaml     # 米雪儿Q技能配置
    ├── mixueer_c.yaml     # 米雪儿C技能配置
    ├── xinchang_q.yaml    # 心昌Q技能配置
    ├── lawei_smoke.yaml   # 拉薇烟雾配置
    └── grenades.yaml      # 通用手雷配置
```

## 使用示例

### 获取补给点

```cpp
// 获取地图上的补给点
const std::vector<LocationInfo>& supplies = DATA_MANAGER()->GetSupplys(mapId);

for (const auto& supply : supplies) {
  float dist = D3D(myPos, supply.m_position);
  if (dist < 500.0f) {
    // 发现附近补给点
  }
}
```

### 获取掩体点

```cpp
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
```

### 获取技能配置

```cpp
// 获取角色技能配置
auto& qLineups = DATA_MANAGER()->GetMiXueErQLineups(mapId);

for (const auto& lineup : qLineups) {
  float distToParent = D3D(myPos, lineup.m_parentPos);
  if (distToParent < 200.0f) {
    // 在投掷位置附近，可以使用此配置
    g::Vector target = lineup.m_childPos;
    float angle = lineup.m_angle;
    // 执行投掷
  }
}
```

## 扩展点

### 添加新地图数据

1. **创建地图配置文件**
```yaml
# config/data/map_9999.yaml
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
```

2. **注册地图ID**
```cpp
// 在 PMMapID 枚举中添加
NEW_MAP = 9999,

// 在 IsLegalMapID 中添加验证
bool DataManager::IsLegalMapID(const int mapID) {
  return m_projectInfo.m_mapResource.count(mapID) > 0;
}
```

### 添加新数据类型

1. **定义数据结构**
```cpp
// src/core/data/data_types.h
struct NewDataType {
  int m_id;
  g::Vector m_position;
  // ... 其他字段
};
```

2. **添加 getter 方法**
```cpp
// 使用宏自动生成
BuildDataManagerGetter(new_data_, std::vector<NewDataType>);

// 或手动添加
const std::vector<NewDataType>& GetNewData(const int mapID);
```

3. **添加解析方法**
```cpp
void ParseNewDataInfo(const YAML::Node& config,
                      std::vector<NewDataType>& result);
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/data/data_manager.h` | DataManager 定义 |
| `src/core/data/data_manager.cc` | DataManager 实现 |
| `src/core/data/data_types.h` | 数据类型定义 |
| `config/data/map_*.yaml` | 地图数据配置 |
| `config/data/lineups/*.yaml` | 技能配置数据 |
| `config/data/crack_regions.csv` | 破裂区域数据 |
