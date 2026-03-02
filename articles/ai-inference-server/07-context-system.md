---
layout: article
title: "上下文系统"
description: "游戏状态管理、敌人追踪、掩体系统、声音感知"
level: intermediate
tags: ["上下文", "状态管理"]
series: ai-inference-server
series_title: "游戏AI推理服务"
title_suffix: "游戏AI推理服务设计"
order: 7
prev:
  title: "角色系统"
  url: "06-character-system.html"
next:
  title: "数据管理系统"
  url: "08-data-management.html"
---

## 1. 概述

上下文系统是核心状态管理组件，负责维护每个AI代理在一帧内的完整游戏状态。`BaseContext` 是所有游戏模式上下文的基类，提供了统一的状态访问接口和生命周期管理。

## 2. 架构图

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
```

## 3. 生命周期管理

### BeginIter - 帧开始

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

## 4. BaseContext 主要成员

```
class BaseContext {
 public:
  // ============ 生命周期 ============
  void BeginIter(...);
  void EndIter();

  // ============ 帧信息 ============
  int FrameNum() const { return m_frameNum; }

  // ============ 代理状态 ============
  AgentStatePtr GetState() const { return m_agentState; }
  const BotState& BotState() const { return m_agentState->m_state; }

  // ============ 敌人信息 ============
  const std::vector<std::pair<float, const NearbyPlayer*>>& getEnemies() const;
  const std::pair<float, const NearbyPlayer*>& getNearestEnemy();
  int GetAliveEnemyNum();
  const NearbyPlayer* GetAimEnemy(bool alive = false);

  // ============ 历史敌人 ============
  const std::pair<int, const NearbyPlayer*>& getHistoryEnemy();

  // ============ 声音感知 ============
  const std::vector<std::pair<float, const SenseState*>>& getSounds();
  const std::pair<int, Vector>& GetLastBulletFlySound();
  const std::pair<int, Vector>& GetLastDamageSource();

  // ============ 掩体系统 ============
  void CalcNiceCoverPoints();
  const std::vector<CoverPoint>& GetCoverPoints();
  bool IsCovered();

  // ============ 动作管理 ============
  AgentActionPtr GetAction() const { return m_action; }
  void AppendAction(ActionPtr action);
  void RemoveAction(const ActionType type, std::string src);
  bool HasAction(const ActionType type);

  // ============ 战斗状态 ============
  virtual int LastFireFrameNum() const;
  virtual float LastHp() const;
  virtual float LastShield() const;
  virtual bool HasAliveEnemy() const;

 protected:
  AgentStatePtr m_agentState;
  std::vector<AgentStatePtr> m_allyStates;
  std::vector<std::pair<float, const NearbyPlayer*>> m_enemies;
  AgentActionPtr m_action;
  int m_frameNum;
};
```

## 5. 游戏模式上下文

| 模式 | 类名 | 说明 |
| --- | --- | --- |
| 爆破 | BombContext | 攻防爆破模式 |
| 热区争夺 | HotZoneContext | 区域控制模式 |
| 团队竞技 | TeamContext | 团队对抗模式 |
| 推车 | PayloadContext | 推车护送模式 |
| 刀战 | KnifeFightContext | 近战模式 |

## 6. 敌人追踪系统

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

## 7. 掩体系统

```
struct CoverPoint {
  Vector m_position;      // 掩体位置
  float m_angle;          // 面向角度
  float m_distance;       // 与代理距离
  int m_coverType;        // 掩体类型
  bool m_isLowCover;      // 是否低矮掩体
};

// 掩体状态机
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

## 8. 声音感知系统

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

## 9. 与其他系统的交互

```
// 与特征提取系统
class FeatureExtractor {
  bool Extract(BaseContext* ctx, std::vector<float>& features) {
    auto& state = ctx->BotState();
    auto& enemies = ctx->getEnemies();
    // ... 提取特征
  }
};

// 与规则系统
class SomeRule : public BaseRule {
  MatchType Match(BaseContext* ctx) override {
    if (ctx->getEnemies().empty()) {
      return MatchType::NONE;
    }
    // ... 规则逻辑
  }
};

// 与动作系统
class ActionBattle : public ActionBase {
  void Encode(BaseContext* ctx, std::vector<float>& actions) override {
    auto& target = ctx->GetTarget();
    // ... 编码战斗动作
  }
};
```

## 10. 扩展点：添加新游戏模式

```
// 1. 创建上下文类
class NewModeContext : public BaseContext {
 public:
  // 模式特有方法
  virtual void SetModeSpecificState(...);
  virtual int GetModeSpecificData();

 protected:
  int m_modeSpecificData;
};

// 工厂注册
REGISTER_CLASS(BaseContext, NewModeContext, "new_mode");

// 2. 重写生命周期方法
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
