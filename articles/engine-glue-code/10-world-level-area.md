---
layout: article
title: "World, Level, and Area"
description: "The spatial hierarchy that organizes everything in the game scene"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 10
prev:
  title: "Client Gameplay: Storyboards and Input"
  url: "09-client-gameplay.html"
next:
  title: "Rendering: Models, Particles, and Lights"
  url: "11-rendering.html"
---

A game world can contain millions of objects — characters, buildings, trees, lights, triggers. Without structure, managing them would be chaos. The engine organizes everything into a three-layer spatial hierarchy: **World**, **Level**, and **Area**.

## World: The Container of Containers

`IWorld` represents an entire game map. It contains named `Levels` (accessible as a dictionary), a `DefaultLevel`, and global systems: `PhysicsSpace` for physics simulation, `NavigateMap` for pathfinding, and `EnvVolume` for environmental effects like fog and sky.

The world also tracks streaming progress. `AppearableTotalCount` and `AppearableReadyCount` tell you how many objects need to load and how many are ready. When everything is loaded, the `ReadyToAppear` event fires. `ClientScenario` manages world lifecycle — `LoadWorld()` loads asynchronously, and `MakeShowRoom()` creates isolated rendering environments for character previews.

> **Word Notes**
> - *streaming* /ˈstriːmɪŋ/ — 流式加载，按需加载场景数据而不是一次全部加载。"Streaming lets the engine load nearby chunks while the player moves."
> - *asynchronously* /eɪˈsɪŋkrənəsli/ — 异步地，不阻塞主线程。"The world loads asynchronously so the game can show a progress bar."

## Level: The Streaming Unit

`ILevel` is a sub-region within a world — think of it as a streaming chunk. Each level has its own `Transform` (position in the world), a `RootArea` containing all its entities, and flags like `NeedPhysics` (whether to simulate physics here) and `EnableProxy` (whether to use LOD proxies for distant objects).

Levels can enter and leave the world dynamically. `EnterWorld()` activates a level, loading its entities and physics. `LeaveWorld()` deactivates it, freeing memory. This is how open-world games handle the vast terrain — only the levels near the player are active at any time.

> **Word Notes**
> - *LOD (Level of Detail)* — 细节层次，根据距离使用不同精度的模型。"LOD proxies replace detailed models with simpler ones at a distance."
> - *chunk* /tʃʌŋk/ — 区块，场景被划分成的可独立加载的区域。"Each chunk is loaded or unloaded based on the player's position."

## Area: The Entity Group

`IArea` is the smallest organizational unit — a group of entities within a level. It exposes an `Entities` list and its own `Storyboard`. Entities enter and leave areas through `IEntity.EnterArea()` and `IEntity.LeaveArea()`. The `EntityDetector` class monitors proximity, firing callbacks when entities enter or leave a configurable radius.

## Key Takeaways

- World → Level → Area forms a three-layer spatial hierarchy
- Levels are the streaming unit — they enter and leave the world dynamically
- Areas group entities and support proximity detection through `EntityDetector`

*Structure is what turns a million scattered objects into a living world.*
