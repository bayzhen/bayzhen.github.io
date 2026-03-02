---
layout: article
title: "UE编辑器中AI掩体数据的自动化生成"
description: "洪水填充、空间网格索引、并行射线检测——掩体射击游戏的AI数据生成管线"
level: advanced
tags: ["UE5", "AI", "掩体系统", "编辑器扩展"]
series: unreal-engine
series_title: "虚幻引擎"
title_suffix: "陈栢成"
order: 1
prev:
  title: "虚幻引擎开发入门指南"
  url: "getting-started.html"
---

在掩体射击类游戏中，AI 需要知道地图上哪里可以躲避、哪里可以射击、从某个位置能看到哪些掩体。如果这些数据全靠关卡设计师手动标注，工作量巨大且容易出错。本文介绍一套在虚幻引擎编辑器内运行的自动化管线，通过洪水填充发现可行走区域，利用空间网格索引加速查询，再用并行射线检测分析掩体可见性，最终输出结构化 JSON 供 AI 训练或运行时决策使用。

## 1. 整体架构与数据流

整个管线在编辑器内运行，不会打包到最终游戏中。核心数据流如下：

```
掩体检测系统                洪水填充
   (识别墙体/障碍物            (发现可行走位置)
    旁的掩体位置)
        │                        │
        ▼                        ▼
    ┌────────────────────────────────┐
    │        数据生成器               │
    │  · 掩体点集合                  │
    │  · 可行走点集合                │
    │  · 点到掩体映射                │
    └───────┬──────────┬────────────┘
            │          │
            ▼          ▼
      关卡 JSON    导航 JSON      编辑器内
    (掩体+映射)   (训练点位)     调试可视化
```

这个设计有几个关键考虑：

| 设计决策 | 原因 |
| --- | --- |
| 仅编辑器模块 | 数据生成只在开发阶段运行，不影响运行时性能 |
| 编辑器内 Tick | 通过ShouldTickIfViewportsOnly() = true让 Actor 在非游戏状态下持续更新，支持实时调试可视化 |
| 并行处理 | 点到掩体映射的计算量极大，使用ParallelFor显著提升速度 |
| 空间网格索引 | 避免可行走点与掩体点之间 O(N*M) 的暴力匹配 |

## 2. 洪水填充发现可行走区域

第一步是找出地图上所有 AI 可以站立的位置。手动标注不现实，所以采用洪水填充（Flood Fill）算法，从一个种子点开始，自动扩展到整个可行走区域。

### 算法流程

1. 将种子 Actor 的位置对齐到 100 单位的网格上
2. 从种子位置向下发射射线，找到地面
3. 从地面命中点出发，尝试向 8 个水平方向（上、下、左、右及四个对角）扩展，每次移动 100 单位
4. 对每个候选邻居位置，执行水平胶囊体检测（Capsule Trace）——如果未命中障碍物，说明该方向可通行
5. 可通行的邻居加入待处理队列，继续扩展
6. 重复直到队列为空或达到安全上限（如 20000 个点）

```
// 网格对齐：将任意坐标吸附到 100 单位网格
FVector SnapToGrid(const FVector& Location, float GridSize = 100.f)
{
    return FVector(
        FMath::RoundToInt(Location.X / GridSize) * GridSize,
        FMath::RoundToInt(Location.Y / GridSize) * GridSize,
        Location.Z
    );
}

// 8 个水平扩展方向
const FVector Directions[] = {
    {100, 0, 0}, {-100, 0, 0}, {0, 100, 0}, {0, -100, 0},
    {100, 100, 0}, {100, -100, 0}, {-100, 100, 0}, {-100, -100, 0}
};

// 对每个方向做胶囊体检测，判断是否可通行
for (const FVector& Dir : Directions)
{
    FVector Neighbor = CurrentPoint + Dir;
    if (!VisitedPoints.Contains(Neighbor))
    {
        FHitResult Hit;
        bool bBlocked = World->SweepSingleByChannel(
            Hit, CurrentPoint, Neighbor,
            FQuat::Identity, ECC_Visibility,
            FCollisionShape::MakeCapsule(30.f, 90.f)
        );
        if (!bBlocked)
        {
            Frontier.Add(Neighbor);
            VisitedPoints.Add(Neighbor);
        }
    }
}
```

**为什么用胶囊体而不是射线？**射线是无限细的一条线，可能从狭缝中穿过。胶囊体检测模拟了 AI 角色的体型，确保通过的路径确实能容纳一个角色。

所有发现的可行走点存入一个 `TSet<FVector>`，同时记录每个点的邻居关系（用于后续路径规划）。100 单位的网格间距在精度和数据量之间取得了平衡——太密会导致数据爆炸，太疏则会遗漏可行走区域。

## 3. 掩体点的采集与过滤

掩体点的检测依赖于对场景几何体的分析——找出墙体和障碍物旁边适合躲避的位置。采集到原始掩体点后，需要进行过滤：

- **姿态过滤**：只保留支持站立掩体（左侧或右侧探出）的点。蹲姿掩体等其他类型可根据需求纳入。
- **位置校验**：掩体点的位置（在 Z 轴 ±200 单位范围内搜索）必须与已知的可行走点匹配。如果一个掩体点位于不可达的区域（如悬崖下方），它对 AI 没有意义。

这一步将原始的掩体检测结果精简为 AI 真正可用的有效掩体集合。

## 4. 空间网格索引加速查询

核心问题来了：对于每个可行走点，需要找出附近哪些掩体能提供有效遮蔽。如果有 N 个可行走点和 M 个掩体点，暴力遍历的复杂度是 O(N\*M)。在大型地图上，N 可能达到数万，M 达到数千，这个计算量不可接受。

### 网格分桶策略

解决方案是建立空间网格索引：将 3D 空间划分为固定大小的网格单元（如 3000×3000×3000 单位），每个掩体点根据坐标归入对应的网格桶中。

```
// 将掩体点分配到空间网格桶
TMap<FIntVector, TArray<int32>> SpatialGrid;

for (int32 i = 0; i < CoverPoints.Num(); ++i)
{
    FIntVector Cell(
        FMath::FloorToInt(CoverPoints[i].Location.X / CellSize),
        FMath::FloorToInt(CoverPoints[i].Location.Y / CellSize),
        FMath::FloorToInt(CoverPoints[i].Location.Z / CellSize)
    );
    SpatialGrid.FindOrAdd(Cell).Add(i);
}
```

查询时，只需检查目标位置所在的网格单元及其 26 个相邻单元（3×3×3 邻域），而不是遍历全部掩体。在此基础上再施加距离阈值（如 9000 单位，代表最大交战距离），进一步缩小候选集。

这将每次查询的候选掩体数量从 M 降低到常数级别，总复杂度从 O(N\*M) 降至接近 O(N)。

## 5. 并行射线检测分析掩体可见性

对于每个可行走点和它附近的候选掩体，需要判断这个掩体是否能提供"部分遮蔽"。这是整条管线中计算量最大的环节。

### 什么是部分遮蔽？

一个掩体点通常有对应的"交战位置"（Fight Point）——AI 从掩体侧面探出射击时站立的位置。从某个可行走点向掩体的交战位置发射多条射线：

- 如果**所有射线都被遮挡**：说明完全看不到掩体后面的 AI，这个掩体对当前位置的敌人没用（射不到）
- 如果**所有射线都畅通**：说明完全暴露，这不算掩体
- 如果**部分遮挡、部分畅通**：这才是有效掩体——AI 既能躲避，又能探出射击

```
// 射线检测判断部分遮蔽
// StandingHeight = 180 单位（模拟站立视角高度）
FVector EyeLevel = LevelPoint + FVector(0, 0, StandingHeight);

int32 BlockedCount = 0;
int32 ClearCount = 0;

for (const FVector& FightPoint : Cover.GetFightPoints())
{
    FVector TargetEye = FightPoint + FVector(0, 0, StandingHeight);
    FHitResult Hit;
    bool bHit = World->LineTraceSingleByChannel(
        Hit, EyeLevel, TargetEye, ECC_Visibility
    );
    if (bHit) BlockedCount++;
    else ClearCount++;
}

// 部分遮蔽 = 既有遮挡又有通视
bool bPartialCover = (BlockedCount > 0 && ClearCount > 0);
```

### 并行化处理

由于每个可行走点的计算相互独立，天然适合并行化。使用 UE 的 `ParallelFor` 将工作分摊到多个线程：

```
FCriticalSection Mutex;
TMap<FVector, TArray<int32>> Point2Covers;

ParallelFor(LevelPoints.Num(), [&](int32 Index)
{
    const FVector& Point = LevelPoints[Index];
    TArray<int32> VisibleCovers;

    // ... 空间索引查询 + 射线检测 ...

    if (VisibleCovers.Num() > 0)
    {
        FScopeLock Lock(&Mutex);
        Point2Covers.Add(Point, MoveTemp(VisibleCovers));
    }
});
```

**线程安全：**多个线程同时写入共享的结果容器时，必须使用 `FCriticalSection`（临界区）保护。锁的粒度要尽量小——只在写入结果时加锁，射线检测本身不需要锁。

## 6. 导航训练点的生成

除了掩体数据，AI 的路径规划训练也需要导航点位。生成逻辑如下：

1. 取所有可行走点，下采样到 300 单位的网格（只保留 X、Y 都是 300 的倍数的点）
2. 对每个保留的点，向下发射射线获取精确地面高度
3. 收集场景中手动放置的墙面标记点（用于标注特殊的贴墙位置）
4. 将所有点导出为 JSON，区分地面点和墙面点

下采样的原因是导航训练不需要 100 单位级别的精度。300 单位的间距在保持路径质量的同时，将数据量缩减到约九分之一。

## 7. JSON 数据管线

整个管线的输出是两类 JSON 文件：

### 关卡 JSON（掩体 + 映射）

```
{
  "cover_point": [
    {
      "id": 1,
      "location_x": 1200.0,
      "location_y": -500.0,
      "location_z": 100.0,
      "angle": 90.0,
      "bCrouchedCover": false,
      "bLeftCoverStanding": true,
      "bRightCoverStanding": true
    }
  ],
  "point2covers": [
    {
      "X": 1100.0,
      "Y": -400.0,
      "Z": 100.0,
      "covers": [1, 3, 7]
    }
  ]
}
```

- `cover_point`：每个掩体的位置、朝向、姿态属性
- `point2covers`：每个可行走点对应的有效掩体 ID 列表

### 导航 JSON（训练点位）

```
{
  "nav_points": [
    {
      "id": 1,
      "location_x": 300.0,
      "location_y": 600.0,
      "location_z": 193.0,
      "angle": 0,
      "type": 0,
      "children": [],
      "2d_point": 0
    }
  ]
}
```

其中 `type` 和 `2d_point` 用于区分地面点（0）和墙面点（1），`children` 字段预留给路径图的邻接关系。

管线支持三种执行方式：一键执行全流程、分步执行（初始化 → 生成 → 保存），以及从已有 JSON 文件加载掩体数据（用于迭代调试而不必每次重新检测掩体）。

## 8. 导航网格的边缘提取与凸包计算

在数据生成之外，还有一组实用的导航网格分析工具，用于理解地图的可行走区域边界。

### 边缘提取与连通分量

从 UE 的 Recast 导航网格中提取边界边（即可行走区域与不可行走区域的交界线），然后用 BFS 将这些边分组成连通的链。对于每条链：

- 构建双向邻接表
- 找出端点（度数为奇数的顶点）
- **线性路径**（2 个端点）：从一端遍历到另一端
- **闭合环路**（0 个端点）：沿环遍历一圈

### 凸包与棱柱可视化

对于需要标注出生点附近可玩区域的场景，使用以下流程：

1. 找到导航网格的所有连通边缘区域
2. 确定哪个区域离玩家出生点最近
3. 对该区域的顶点计算 2D 凸包（Graham Scan 算法）
4. 将凸包向外扩展 100 单位（预留缓冲）
5. 沿 Z 轴拉伸为 3D 棱柱并在编辑器中可视化

```
// Graham Scan 凸包算法的核心步骤
// 1. 找到 Y 最小的点作为起始点
// 2. 按极角排序其余点
// 3. 依次处理排序后的点，维护一个凸包栈：
//    若新点让路径"右拐"则弹出栈顶，否则入栈

TArray<FVector2D> ConvexHull;
ConvexHull.Add(SortedPoints[0]);
ConvexHull.Add(SortedPoints[1]);

for (int32 i = 2; i < SortedPoints.Num(); ++i)
{
    while (ConvexHull.Num() > 1 &&
           CrossProduct2D(
               ConvexHull.Last(1), ConvexHull.Last(), SortedPoints[i]
           ) <= 0)
    {
        ConvexHull.Pop();
    }
    ConvexHull.Add(SortedPoints[i]);
}

// 向外扩展凸包
for (int32 i = 0; i < ConvexHull.Num(); ++i)
{
    FVector2D EdgeDir = (ConvexHull[(i+1) % N] - ConvexHull[i]).GetSafeNormal();
    FVector2D Outward(-EdgeDir.Y, EdgeDir.X);
    ConvexHull[i] += Outward * ExpandDistance;
}
```

## 9. 编辑器内调试可视化

数据生成的结果需要直观验证。系统提供两种可视化模式：

### 静态可视化

- **可行走点**：在每个点的位置绘制红色竖线
- **邻居连接**：用绿色线段连接相邻的可行走点
- **掩体点**：用绿色球体标注位置，绿色箭头指示掩体朝向

使用 `ULineBatchComponent` 进行批量渲染，避免逐条绘制带来的性能问题。

### 交互式可视化

放置一个检测器 Actor 到场景中，它会实时绘制从自身位置到附近所有掩体交战位置的射线：

- **黄色线**：射线被遮挡（该方向有掩蔽）
- **红色线**：射线畅通（该方向暴露）

设计师可以在场景中自由移动检测器，实时验证任何位置的掩体有效性。这种所见即所得的调试方式能快速发现数据中的问题。

## 10. 性能考量与优化经验

在实际的大型关卡中，这套管线处理的数据量可能非常大。以下是几个关键的性能优化点：

| 优化措施 | 效果 |
| --- | --- |
| 100 单位网格对齐 | 自动去重，将可行走点数量控制在可管理范围内 |
| 3000 单位空间网格索引 | 将掩体查询从 O(M) 降至 O(1) 均摊 |
| 9000 单位距离阈值 | 跳过超出交战距离的掩体，减少无效射线检测 |
| ParallelFor并行处理 | 充分利用多核 CPU，线性加速射线检测 |
| 300 单位下采样 | 导航点数据量缩减为原来的九分之一 |
| 20000 点安全上限 | 防止超大地图导致洪水填充失控 |

空间网格的单元大小（3000 单位）需要根据实际场景调整。太小会导致过多的跨单元查询，太大则失去索引的意义。一个好的经验法则是让单元大小略大于最大交战距离的三分之一。

## 总结

这套编辑器内的 AI 数据生成管线将几个经典算法组合起来，解决了掩体射击游戏的一个实际工程问题：

- **洪水填充**发现可行走区域，胶囊体检测保证路径可通行
- **空间网格索引**将 O(N\*M) 的暴力匹配降维为 O(N)
- **并行射线检测**利用多核 CPU 加速最耗时的可见性分析
- **部分遮蔽**的判定标准精确定义了"有效掩体"
- **JSON 管线**将编辑器内生成的数据桥接到外部 AI 系统

整个系统的设计思路也适用于其他需要空间数据预处理的场景：可行走区域分析、视线检测、战术位置评估等。关键在于选择合适的空间划分策略和并行化粒度，在数据精度与计算成本之间找到平衡。
