---
layout: article
title: "Client Gameplay: Storyboards and Input"
description: "How the Storyboard pattern drives time, input, and player lifecycle on the client"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 9
prev:
  title: "Physics World: Collision and Rigid Bodies"
  url: "08-physics-world.html"
next:
  title: "World, Level, and Area"
  url: "10-world-level-area.html"
---

Every game has a heartbeat — a tick that fires each frame, advancing time and processing input. In this engine, that heartbeat is the **Storyboard**. It is not just a timeline for cutscenes. It is the universal tick driver for nearly every client-side system.

## The Storyboard Pattern

`IStoryboard` is a component with `Move()`, `Stop()`, and `Step()` methods. It fires a `StoryTick` event every frame with the elapsed delta time. You can adjust its `Speed` to slow down or fast-forward, set a `FixedDelta` for deterministic simulation, or schedule callbacks with `AddCallback(delay, fn)`.

The pattern becomes powerful through inheritance. `ClientPlayer`, `ClientNavigator`, and `ClientScenario` all extend `IStoryboard`. This means the player, the editor camera, and the world loader all have their own independent timelines with controllable speed and frame limits.

> **Word Notes**
> - *tick* /tɪk/ — 帧更新，游戏每帧执行的逻辑循环。"The game logic runs inside the tick callback."
> - *deterministic* /dɪˌtɜːmɪˈnɪstɪk/ — 确定性的，相同输入产生相同输出。"A fixed delta ensures deterministic physics across different frame rates."

## Input Events on ClientPlayer

`ClientPlayer` is where all input arrives. It defines events for every input channel: `KeyDown`, `KeyUp`, `MouseLDown`, `MouseMove`, `MouseWheelUp`, `TouchDown`, `TouchMove`, `JoystickMove`, and more. Each event passes raw data — key codes, screen coordinates, pressure values — to Python callbacks.

The player also aggregates sub-components: `Camera` (the active camera entity), `Manipulator` (for editor-style gizmo transforms), `Navigator` (for free-roaming camera control), and `Picker` (for object selection via raycasting).

> **Word Notes**
> - *aggregate* /ˈæɡrɪɡeɪt/ — 聚合，将多个子组件组合到一个对象中。"ClientPlayer aggregates camera, input, and selection into one object."
> - *gizmo* /ˈɡɪzmoʊ/ — 小工具，编辑器中用于移动/旋转/缩放物体的可视化控件。"The translate gizmo lets you drag objects along an axis."

## IGameplay: The Top-Level Orchestrator

Above everything sits `IGameplay`. It owns the `Controller`, `Scenario`, and `Player`. It provides `Move()` and `Stop()` to start or pause the entire gameplay session. It also manages object lifetime through `AddHoldingInstance()` — pinning objects in memory so Python's garbage collector cannot reclaim them during critical moments.

## Key Takeaways

- `IStoryboard` is the universal tick driver — player, navigator, and scenario all inherit from it
- `ClientPlayer` receives all input events and aggregates camera, picker, and manipulator
- `IGameplay` orchestrates the entire client session: controller, scenario, and player

*Time in a game is not a river — it is a machine, and the Storyboard is its gearbox.*
