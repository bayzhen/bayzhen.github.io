# 上下文系统设计文档

## 概述

上下文系统是AIServer的核心状态管理组件，负责维护每个AI代理在一帧内的完整游戏状态。`BaseContext` 是所有游戏模式上下文的基类，提供了统一的状态访问接口和生命周期管理。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        PredictExecutor                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ 创建/管理
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BaseContext                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     生命周期管理                          │   │
│  │  BeginIter() ──► 处理帧 ──► EndIter()                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     状态数据                             │   │
│  │  m_agentState     - 当前代理状态                        │   │
│  │  m_allyStates     - 队友状态列表                        │   │
│  │  m_enemies        - 敌人列表(按距离排序)                 │   │
│  │  m_action         - 输出动作                            │   │
│  │  m_target         - 目标信息                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ 继承
        ┌─────────────────────┼─────────────────────────────┐
        ▼                     ▼                             ▼
┌───────────────┐    ┌───────────────┐            ┌───────────────┐
│ BombContext   │    │ HotZoneContext│            │ TeamContext   │
│   (爆破模式)   │    │  (热区模式)    │            │  (团队模式)    │
└───────────────┘    └───────────────┘            └───────────────┘
        │                     │                             │
        └─────────────────────┼─────────────────────────────┘
                              ▼
                    ┌───────────────────┐
                    │   更多游戏模式...   │
                    │ Payload, Zombie,  │
                    │ GunKing, etc.     │
                    └───────────────────┘
```

## 生命周期管理

### BeginIter - 帧开始

```cpp
// src/core/context/base_context.h:29-31
void BeginIter(const AgentStatePtr& s,
               const std::vector<AgentStatePtr>& allies,
               std::map<uint64_t, AllyExtendInfo>& allyExtendInfo,
               std::map<uint64_t, std::vector<g::BuffInfo>>& actorBuffs);
```

`BeginIter` 在每帧开始时调用，初始化以下内容：

```
BeginIter()
    │
    ├──► 保存代理状态 (m_agentState)
    │
    ├──► 保存队友状态 (m_allyStates)
    │
    ├──► 处理敌人列表
    │    ├── 按距离排序敌人
    │    ├── 过滤死亡敌人
    │    └── 更新历史敌人记录
    │
    ├──► 处理声音感知
    │    ├── 子弹飞行声音
    │    └── 伤害源定位
    │
    ├──► 计算掩体点
    │    └── CalcNiceCoverPoints()
    │
    └──► 更新帧计数器
```

### EndIter - 帧结束

```cpp
void EndIter();
```

`EndIter` 在帧结束时调用，执行清理和状态保存：

```
EndIter()
    │
    ├──► 保存当前帧状态到历史
    │    ├── m_lastHp
    │    ├── m_lastShield
    │    └── m_lastAliveState
    │
    ├──► 更新帧计数器
    │
    └──► 清理临时数据
```

## 核心类设计

### BaseContext 主要成员

```cpp
// src/core/context/base_context.h
class BaseContext {
 public:
  // ============ 生命周期 ============
  virtual ~BaseContext() = default;
  void BeginIter(...);
  void EndIter();

  // ============ 帧信息 ============
  int FrameNum() const { return m_frameNum; }
  int RoundFrameNum() const { return m_roundFrameNum; }

  // ============ 代理状态 ============
  AgentStatePtr GetState() const { return m_agentState; }
  const g::BotState& BotState() const { return m_agentState->m_state; }

  // ============ 队友信息 ============
  const std::vector<AgentStatePtr>& GetAllyStates() const { return m_allyStates; }
  const std::map<uint64_t, AllyExtendInfo>& GetAllyExtendInfo() { return m_allyExtendInfo; }

  // ============ 敌人信息 ============
  const std::vector<std::pair<float, const g::NearbyPlayer*>>& getEnemies() const { return m_enemies; }
  const std::pair<float, const g::NearbyPlayer*>& getNearestEnemy() { return m_nearestEnemy; }
  int GetAliveEnemyNum() { return m_aliveEnemy; }
  const g::NearbyPlayer* GetAimEnemy(bool alive = false);

  // ============ 历史敌人 ============
  const std::pair<int, const g::NearbyPlayer*>& getHistoryEnemy() { return m_historyEnemy; }
  const std::vector<std::pair<int, g::NearbyPlayer>>& GetHistoryEnemies() const { return m_historyEnemies; }

  // ============ 声音感知 ============
  const std::vector<std::pair<float, const g::SenseState*>>& getSounds() { return m_sounds; }
  const std::pair<int, g::Vector>& GetLastBulletFlySound() { return m_lastBulletFlySound; }
  const std::pair<int, g::Vector>& GetLastDamageSource() { return m_lastDamageSource; }

  // ============ 掩体系统 ============
  void CalcNiceCoverPoints();
  const std::vector<CoverPoint>& GetCoverPoints() { return m_coverPoints; }
  const g::Vector& GetCoverPosition() { return m_coverPosition; }
  bool IsCovered() { return m_isCoveredByRealWall; }
  virtual int GetCoverState() { return m_coverState; }
  virtual void SetCoverState(int state) { m_coverState = state; }

  // ============ 补给点 ============
  SupplyInfo& GetSupply() { return m_supply; }
  const std::vector<LocationInfo>& GetSupplyLocations();
  std::vector<int>& GetNearbySupplyIndexs() { return m_nearbySupplyIndex; }

  // ============ 埋伏点 ============
  AmbushInfo& GetAmbush() { return m_ambush; }

  // ============ 目标信息 ============
  void SetTarget(const TargetInfo& target);
  TargetInfo& GetTarget() { return m_target; }
  void SetDefusePoint(g::Vector pos) { m_defusePoint = pos; }
  g::Vector& GetDefusePoint() { return m_defusePoint; }

  // ============ 动作管理 ============
  AgentActionPtr GetAction() const { return m_action; }
  void AppendAction(g::ActionPtr action);
  void RemoveAction(const g::ActionType type, std::string src);
  bool HasAction(const g::ActionType type);
  g::ActionPtr GetSelectAction(const g::ActionType type);

  // ============ 战斗状态 ============
  virtual int LastFireFrameNum() const { return m_lastFireFrameNum; }
  virtual int LastDamages() const { return m_lastDamages; }
  virtual float LastHp() const { return m_lastHp; }
  virtual float LastShield() const { return m_lastShield; }
  virtual bool HasAliveEnemy() const { return m_hasAliveEnemy; }
  virtual int CanFireFrame() const { return m_canFireFrame; }
  virtual bool LastFiring() const { return m_lastFiring; }

  // ============ 瞄准状态 ============
  virtual int LastAimFrame() const { return m_lastAimFrame; }
  virtual float GetLastAimAngle() const { return m_lastAimAngle; }
  virtual void SetLastAimFrame(int frame) { m_lastAimFrame = frame; }
  virtual int GetAimFrameNum() const { return m_aimFrameNum; }

  // ============ 技能状态 ============
  const int GetKeepActiveQFrame() { return m_keepActiveQFrame; }
  const int GetKeepActiveXFrame() { return m_keepActiveXFrame; }
  virtual float UseGrenadeFrame() const { return m_useGrenadeFrame; }
  virtual float GetReactFrame() { return m_reactFrame; }

  // ============ 武器切换 ============
  virtual void SetLastSwitchWpFrame(const int frame) { m_lastSwitchWpFrame = frame; }
  virtual int LastSwitchWpFrame() const { return m_lastSwitchWpFrame; }
  virtual bool CanSwitchWeapon();

  // ============ 追踪信息 ============
  const std::vector<float>& GetTraceInfo() const { return m_traceInfo; }
  void SetTraceIndex(TraceType type, int s, int e);
  bool GetTraceInfo(TraceType type, std::vector<float>& res, const std::string& src, int size = 0);

  // ============ 性能统计 ============
  virtual void SetDepthCost(long long costTime);
  virtual void SetLinetraceCost(long long costTime);

 protected:
  // 核心状态数据
  AgentStatePtr m_agentState;
  std::vector<AgentStatePtr> m_allyStates;
  std::map<uint64_t, AllyExtendInfo> m_allyExtendInfo;

  // 敌人数据
  std::vector<std::pair<float, const g::NearbyPlayer*>> m_enemies;
  std::pair<float, const g::NearbyPlayer*> m_nearestEnemy;
  std::pair<int, const g::NearbyPlayer*> m_historyEnemy;

  // 动作输出
  AgentActionPtr m_action;
  TargetInfo m_target;

  // 帧计数
  int m_frameNum;
  int m_roundFrameNum;

  // 更多成员...
};
```

## 游戏模式上下文

### 支持的游戏模式

| 模式 | 类名 | 文件 | 说明 |
|-----|------|------|------|
| 爆破 | BombContext | bomb_context.h | 攻防爆破模式 |
| 热区争夺 | HotZoneContext | hot_zone_context.h | 区域控制模式 |
| 团队竞技 | TeamContext | team_context.h | 团队对抗模式 |
| 推车 | PayloadContext | payload_context.h | 推车护送模式 |
| 大头模式 | BigHeadContext | big_head_context.h | 大头变身模式 |
| 刀战 | KnifeFightContext | knife_fight_context.h | 近战模式 |
| 枪王模式 | GunKingContext | gun_king_context.h | 枪械切换模式 |
| 挖矿模式 | MineContext | mine_context.h | 资源收集模式 |
| 团队乱斗 | TeamBrawlContext | team_brawl_context.h | 自由混战模式 |
| 僵尸模式 | ZombieContext | zombie_context.h | PvE僵尸模式 |
| 爆破标记 | BombTagContext | bomb_tag_context.h | 标记爆破模式 |

### 模式特定扩展

```cpp
// src/core/context/bomb_context.h (示例)
class BombContext : public BaseContext {
 public:
  // 爆破模式特有方法
  virtual void SetBombState(BombState state);
  virtual BombState GetBombState();

  virtual void SetPlantArea(int area);
  virtual int GetPlantArea();

  virtual bool IsAttacker();
  virtual bool IsDefender();

  // 炸弹位置
  virtual g::Vector GetBombPosition();

 protected:
  BombState m_bombState;
  int m_plantArea;
  bool m_isAttacker;
};
```

```cpp
// src/core/context/hot_zone_context.h (示例)
class HotZoneContext : public BaseContext {
 public:
  // 热区模式特有方法
  virtual void SetActiveZone(int zoneId);
  virtual int GetActiveZone();

  virtual float GetZoneProgress();
  virtual bool IsInZone();

 protected:
  int m_activeZoneId;
  float m_zoneProgress;
};
```

## 敌人追踪系统

### 敌人列表管理

```cpp
// 当前帧可见敌人 (按距离排序)
const std::vector<std::pair<float, const g::NearbyPlayer*>>& getEnemies() const;

// 最近的敌人
const std::pair<float, const g::NearbyPlayer*>& getNearestEnemy();

// 历史敌人记录 (包含帧号)
const std::pair<int, const g::NearbyPlayer*>& getHistoryEnemy();
const std::vector<std::pair<int, g::NearbyPlayer>>& GetHistoryEnemies() const;

// 检测到的敌人 (包括间接检测)
const std::vector<std::pair<int, const g::NearbyPlayer*>>& getDetectedEnemies() const;
const std::vector<std::pair<int, const g::NearbyPlayer*>>& getAliveDetectedEnemies();

// 全局敌人信息
std::vector<std::pair<float, const g::PlayerAliveStateInfo*>>& getSortedGlobalEnemies();
```

### 敌人排序流程

```
敌人原始列表
      │
      ▼
┌─────────────────────────────────────┐
│     过滤: 移除死亡/无效敌人          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     计算: 与自己的3D距离             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     排序: 按距离升序                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  存储: m_enemies, m_nearestEnemy    │
└─────────────────────────────────────┘
```

## 掩体系统

### 掩体点计算

```cpp
// 计算当前位置附近最佳掩体点
void CalcNiceCoverPoints();

// 获取计算结果
const std::vector<CoverPoint>& GetCoverPoints();
const g::Vector& GetCoverPosition();
```

### CoverPoint 结构

```cpp
struct CoverPoint {
  g::Vector m_position;      // 掩体位置
  float m_angle;             // 面向角度
  float m_distance;          // 与代理距离
  int m_coverType;           // 掩体类型
  bool m_isLowCover;         // 是否低矮掩体
};
```

### 掩体状态机

```
          ┌──────────────────┐
          │  COVER_NONE = 0  │
          │    (无掩体)       │
          └────────┬─────────┘
                   │ 接近掩体
                   ▼
          ┌──────────────────┐
          │ COVER_SEEKING=1  │
          │   (寻找掩体)      │
          └────────┬─────────┘
                   │ 到达掩体
                   ▼
          ┌──────────────────┐
          │ COVER_BEHIND=2   │
          │   (在掩体后)      │
          └────────┬─────────┘
                   │ 探头射击
                   ▼
          ┌──────────────────┐
          │ COVER_PEEKING=3  │
          │    (探头中)       │
          └──────────────────┘
```

## 动作管理

### 动作追加与移除

```cpp
// 追加动作到输出
void AppendAction(g::ActionPtr action) {
  m_action->m_actionDict[action->m_action] = action;
}

// 移除特定类型动作
void RemoveAction(const g::ActionType type, std::string src);

// 检查是否有特定动作
bool HasAction(const g::ActionType type);

// 获取特定类型动作
g::ActionPtr GetSelectAction(const g::ActionType type);
```

### 动作字符串化

```cpp
std::string ActionString() {
  std::stringstream ss_action;
  ss_action << "[";
  for (auto it = m_action->m_actionDict.begin();
       it != m_action->m_actionDict.end(); ++it) {
    if (ss_action.str() != "[") ss_action << ", ";
    ss_action << it->second->toYaml();
  }
  ss_action << "]";
  return ss_action.str();
}
```

## 声音感知系统

### 声音类型

```cpp
// 获取按距离排序的声音列表
const std::vector<std::pair<float, const g::SenseState*>>& getSounds();

// 历史声音记录
const std::pair<int, const g::SenseState*>& getHistorySound();

// 子弹飞行声音 (帧号, 位置)
const std::pair<int, g::Vector>& GetLastBulletFlySound();

// 伤害来源 (帧号, 位置)
const std::pair<int, g::Vector>& GetLastDamageSource();
```

### 声音响应决策

```
声音感知
    │
    ├──► 子弹飞行声
    │    └── 判断方向，准备反击
    │
    ├──► 脚步声
    │    └── 预警敌人接近
    │
    ├──► 技能声音
    │    └── 躲避或准备应对
    │
    └──► 伤害来源
         └── 定位攻击者位置
```

## 追踪信息系统

### TraceType 类型

```cpp
enum TraceType {
  TRACE_DEPTH = 0,     // 深度图追踪
  TRACE_LINETRACE = 1, // 射线追踪
  // ...
};
```

### 追踪数据访问

```cpp
// 设置追踪数据索引
void SetTraceIndex(TraceType type, int s, int e);

// 获取追踪数据
bool GetTraceInfo(TraceType type, std::vector<float>& res,
                  const std::string& src, int size = 0);
```

## 性能统计

### 耗时记录

```cpp
virtual void SetDepthCost(long long costTime) {
  m_depthCost = costTime;
  AddTimecostRecord(TimecostTag::kDepth, "main", costTime);
}

virtual void SetLinetraceCost(long long costTime) {
  m_linetraceCost = costTime;
  AddTimecostRecord(TimecostTag::kLineTrace, "main", costTime);
}
```

## 与其他系统的交互

### 与特征提取系统

```cpp
// 特征提取器通过 context 获取状态
class FeatureExtractor {
  bool Extract(BaseContext* ctx, std::vector<float>& features) {
    auto& state = ctx->BotState();
    auto& enemies = ctx->getEnemies();
    // ... 提取特征
  }
};
```

### 与规则系统

```cpp
// 规则通过 context 检查条件
class SomeRule : public BaseRule {
  MatchType Match(BaseContext* ctx) override {
    if (ctx->getEnemies().empty()) {
      return MatchType::NONE;
    }
    // ... 规则逻辑
  }
};
```

### 与动作系统

```cpp
// 动作编码使用 context 状态
class ActionBattle : public ActionBase {
  void Encode(BaseContext* ctx, std::vector<float>& actions) override {
    auto& target = ctx->GetTarget();
    // ... 编码战斗动作
  }
};
```

## 扩展点

### 添加新游戏模式

1. **创建上下文类**
```cpp
// src/core/context/new_mode_context.h
class NewModeContext : public BaseContext {
 public:
  // 模式特有方法
  virtual void SetModeSpecificState(...);
  virtual int GetModeSpecificData();

 protected:
  // 模式特有成员
  int m_modeSpecificData;
};

// 工厂注册
REGISTER_CLASS(BaseContext, NewModeContext, "new_mode");
```

2. **重写生命周期方法**
```cpp
void NewModeContext::BeginIter(...) {
  BaseContext::BeginIter(...);
  // 模式特有初始化
  InitModeSpecificData();
}

void NewModeContext::EndIter() {
  // 模式特有清理
  CleanupModeSpecificData();
  BaseContext::EndIter();
}
```

### 添加新状态数据

```cpp
// 在 BaseContext 或子类中添加
class BaseContext {
 public:
  // 新状态访问器
  const NewStateType& GetNewState() { return m_newState; }
  void SetNewState(const NewStateType& state) { m_newState = state; }

 protected:
  NewStateType m_newState;
};
```

## 关键文件路径

| 文件 | 说明 |
|-----|------|
| `src/core/context/base_context.h` | 基类定义 |
| `src/core/context/base_context.cc` | 基类实现 |
| `src/core/context/bomb_context.h` | 爆破模式上下文 |
| `src/core/context/hot_zone_context.h` | 热区模式上下文 |
| `src/core/context/team_context.h` | 团队模式上下文 |
| `src/core/context/payload_context.h` | 推车模式上下文 |
| `src/core/context/zombie_context.h` | 僵尸模式上下文 |
