---
layout: series-index
title: "Engine Glue Code: English Reading"
description: "How Python stubs bridge a C++ game engine — bindings, type hints, entity-component wrappers, and type marshalling"
series_id: engine-glue-code
lang: en
---

## About This Series

Game engines are written in C++ for raw performance, but gameplay programmers often prefer scripting languages like Python for fast iteration. The gap between these two worlds is filled by **glue code** — auto-generated Python stubs that mirror C++ classes, marshal types across the language boundary, and provide IDE autocompletion. This series uses a real production engine to show how glue code actually works.

Whether you are a game developer curious about engine internals or a Python programmer wondering how scripting layers are built, these articles reveal patterns you will find in every major engine.

## What You'll Find

**Foundations (Articles 1–5)**
- **What Is Glue Code**: Why game engines need a scripting bridge and what it looks like in practice
- **The Stub Pattern**: How `.py` and `.pyi` files work together for documentation and type safety
- **Entity-Component Wrappers**: How C++ entities and components become Pythonic objects with properties and events
- **Engine Module Bindings**: How system-level functions (rendering, physics, file I/O) are exposed to scripts
- **Type Marshalling**: How C++ types like `Vector3` and `Matrix4x3` cross the language boundary

**Subsystems (Articles 6–15)**
- **Camera System**: The composable placer tree — sensors, blenders, shakers, and colliders
- **Vehicle Physics**: Engine torque, gear ratios, tire friction, suspension, and differential config
- **Physics World**: Rigid bodies, raycasts, collision shapes, ragdolls, and destructibles
- **Client Gameplay**: The Storyboard tick driver, input events, and the IGameplay orchestrator
- **World, Level, and Area**: The three-layer spatial hierarchy for streaming and entity management
- **Rendering**: Models, particles, terrain, lights, and post-processing effects
- **Skeleton and Animation**: Bone queries, animation playback, effects, and collision volumes
- **Navigation**: Nav meshes, pathfinding, dynamic obstacles, and trigger zones
- **Sound and Audio**: 3D spatial audio, FMOD/Wwise events, ambient volumes, and recording
- **Platform Services**: Patching, device info, AR, push notifications, crash reports, and SDK bridges

## How to Use This Series

Each article is 300–500 words — short enough to copy out by hand in one sitting. Difficult words are annotated inline. Read straight through, or jump to any article that interests you.

Start with [What Is Glue Code?](01-what-is-glue-code.html).
