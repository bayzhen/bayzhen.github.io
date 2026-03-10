---
layout: article
title: "Navigation and Pathfinding"
description: "Nav maps, pathfinding queries, dynamic obstacles, and navigator agents"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 13
prev:
  title: "Skeleton and Animation"
  url: "12-skeleton-animation.html"
next:
  title: "Sound and Audio Architecture"
  url: "14-sound-audio.html"
---

How does an NPC know the shortest path from the tavern to the castle gate? How does it avoid the newly placed barricade? The answer is the navigation system — a pre-built map of walkable surfaces combined with runtime pathfinding algorithms.

## The Navigation Map

`INavigateMap` is the data source for all pathfinding. It holds a nav mesh — a collection of convex polygons representing walkable areas. The map provides coordinate conversion (`WorldToMapPos`, `MapToWorldPos`), height queries (`GetHeight`), and mask queries (`GetMapMask`) to check terrain type at any point.

Pathfinding itself is a single call: `FindPath(startPos, endPos, radius)` returns a list of waypoints. Variants like `FindPathF` accept navigation flags to restrict which areas are walkable. `IsConnected()` checks whether two points can reach each other at all — useful before committing to a long path calculation.

> **Word Notes**
> - *nav mesh* — 导航网格，由凸多边形组成的可行走区域表示。"The nav mesh is baked from level geometry during the build process."
> - *waypoint* /ˈweɪpɔɪnt/ — 路径点，路径上的中间目标位置。"The NPC follows waypoints from start to goal."

## The Navigator Agent

`INavigatorComponent` is the moving agent that follows paths. Attach it to an entity, call `MoveTo(destination)`, and it handles everything: path query, obstacle avoidance, and smooth steering. `FollowTarget()` makes it chase another entity. `Cancel()` stops movement.

The navigator exposes dozens of tuning properties: `MoveSpeed`, `AngularSpeed`, `ObstacleRadius`, `CollisionQueryRange`, and `EnableSmoothPath`. It fires `Arrived` when reaching the destination and `Blocked` when stuck. `AreaIDChanged` fires when crossing into a different navigation area.

> **Word Notes**
> - *obstacle avoidance* — 避障，实时绕开其他移动物体。"Obstacle avoidance prevents NPCs from walking through each other."
> - *steering* /ˈstɪərɪŋ/ — 转向行为，控制代理如何调整方向。"Smooth steering blends path following with collision avoidance."

## Dynamic Obstacles and Triggers

The world is not static. `INavigateObstacle` places dynamic obstacles on the nav mesh — barricades, closed doors, fallen trees. `INavigateGadget` defines custom navigation areas with polygon vertices. `INavigateTrigger` creates zones that fire `NavigatorEntered` and `NavigatorLeaved` events when agents cross their boundaries — perfect for ambient dialogue or encounter triggers.

## Key Takeaways

- `INavigateMap` provides pathfinding, height queries, and connectivity checks on a nav mesh
- `INavigatorComponent` is the agent that follows paths with speed, avoidance, and event callbacks
- Obstacles, gadgets, and triggers make navigation dynamic and interactive

*Pathfinding is the invisible hand that guides every NPC through the world — and the player never notices.*
