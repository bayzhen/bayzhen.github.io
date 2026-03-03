---
layout: article
title: "System Architecture Overview"
description: "High-level architecture of a multiplayer third-person shooter — module decomposition, layered design, and dependency management"
lang: en
level: beginner
tags: ["Architecture", "System Design", "Multiplayer"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 1
next:
  title: "Character System Design"
  url: "02-character-system.html"
---

## 1. The Big Picture

A multiplayer third-person shooter (TPS) is one of the most *architecturally demanding* (架构要求最高的) types of games. It needs to handle real-time combat, physics, animation, networking, and UI — all running at 60 frames per second on multiple platforms.

Good architecture does not happen by accident. It requires *deliberate* (深思熟虑的) decomposition — breaking the system into modules that are small enough to understand, yet connected enough to work together seamlessly.

> 句型解析: "It requires deliberate decomposition — breaking the system into modules" — 这里破折号后面的部分是对 "decomposition" 的进一步解释，意为将系统拆分为多个可理解的模块。

## 2. Client-Server Model

Most online shooters use a **dedicated server** architecture:

```
┌─────────────────────┐
│   Game Client (PC)  │──┐
└─────────────────────┘  │
┌─────────────────────┐  │    ┌──────────────────────┐
│ Game Client (Mobile)│──┼───▶│  Dedicated Server     │
└─────────────────────┘  │    │  (Authoritative)      │
┌─────────────────────┐  │    └──────────────────────┘
│ Game Client (Console)│──┘
└─────────────────────┘
```

The **dedicated server** (专用服务器) is *authoritative* (权威的) — it makes the final decision on game state. Clients send input and receive updates. This prevents cheating and ensures *consistency* (一致性) across all players.

### Why Not Peer-to-Peer?

Peer-to-peer (P2P) networking works for small casual games, but shooters need:

- **Anti-cheat protection** — a trusted server validates every action
- **Low latency fairness** — the server *arbitrates* (仲裁) hit detection
- **Scalable matchmaking** — centralized servers manage player pools

## 3. Module Decomposition

A typical TPS project can be decomposed into the following major modules:

```
┌──────────────────────────────────────────────────────┐
│                    Game Project                       │
├──────────┬──────────┬──────────┬─────────────────────┤
│ Character│  Weapon  │ Ability  │    Gameplay          │
│ System   │  System  │ System   │    (Game Modes)      │
├──────────┼──────────┼──────────┼─────────────────────┤
│    UI    │    AI    │ Animation│    Player            │
│  System  │  System  │  System  │    System            │
├──────────┴──────────┴──────────┴─────────────────────┤
│              Online / Network Layer                   │
├──────────────────────────────────────────────────────┤
│         Engine (Rendering, Physics, Audio)            │
└──────────────────────────────────────────────────────┘
```

Each module has a clear *responsibility* (职责):

| Module | Responsibility |
| --- | --- |
| **Character** | Player and NPC characters — health, armor, movement, state machine |
| **Weapon** | All weapon types — shooting, reloading, recoil, attachments |
| **Ability** | Skills, buffs, debuffs — attribute modification, cooldowns |
| **Gameplay** | Game modes — round management, scoring, win conditions |
| **UI** | HUD, menus, loading screens — view management, input routing |
| **AI** | Bot behavior — perception, decision-making, difficulty scaling |
| **Animation** | Character and weapon animation — locomotion, notify events |
| **Player** | Player controller, player state — input, spectating, respawn |
| **Online** | Networking — replication, matchmaking, lobby, reconnection |

> 句型解析: "Each module has a clear responsibility" — 单一职责原则 (Single Responsibility Principle) 是软件设计的基本原则，每个模块只负责一件事。

## 4. Layered Architecture

The modules above are not all equal — they form a *layered* (分层的) architecture where higher layers depend on lower ones, but not the reverse:

### Layer 1 — Engine Layer

The game engine provides rendering, physics, audio, input, and basic networking. This layer is rarely modified directly.

### Layer 2 — Framework Layer

Custom *frameworks* (框架) built on top of the engine:

- **Ability framework** — a data-driven system for skills and effects
- **UI framework** — a view management system with page/panel lifecycle
- **Network framework** — session management, protocol dispatch, heartbeat

### Layer 3 — Game Logic Layer

Game-specific logic that uses the framework:

- Individual game modes (bomb *defusal* (拆弹), escort, team deathmatch)
- Character-specific abilities
- Weapon balance tuning
- AI behavior trees for specific scenarios

### Layer 4 — Scripting Layer

Hot-reloadable scripts (such as Lua) that allow designers to *iterate* (迭代) on gameplay without recompiling:

- Ability parameters
- UI layout tweaks
- Event-driven game logic

> 句型解析: "Hot-reloadable scripts that allow designers to iterate on gameplay without recompiling" — "hot-reloadable" (热加载的) 意为可以在游戏运行时替换脚本而无需重新编译整个程序。

## 5. Cross-Platform Considerations

A modern shooter often ships on PC, mobile, and consoles. This creates architectural pressure:

| Challenge | Design Solution |
| --- | --- |
| Different input methods | Abstract input layer — keyboard, gamepad, touchscreen all map to the same actions |
| Performance *variance* (差异) | Scalable rendering — quality settings, dynamic resolution |
| Platform-specific SDKs | Platform *abstraction* layer (平台抽象层) — login, payment, voice chat wrapped behind interfaces |
| Screen size differences | Separate mobile UI module with touch-optimized controls |
| Certification requirements | Build target system — each platform has its own build configuration |

## 6. Data-Driven Design

A key architectural principle in shooters is **data-driven design** — separating *what* happens from *how* it is configured:

- **Weapon stats** live in data tables, not in code
- **Ability effects** are defined by designers using tags and parameters
- **Game mode rules** are configured through data assets
- **AI behavior** is tuned through blackboard variables and difficulty configs

This means a designer can create a new weapon by filling out a spreadsheet, without writing a single line of code.

## 7. Dependency Management

In a project with 40+ subsystems, managing *dependencies* (依赖关系) is critical. Key rules include:

1. **No circular dependencies** — if Module A depends on Module B, then B must not depend on A
2. **Depend on abstractions** — modules communicate through *interfaces* (接口), not concrete classes
3. **Event-driven communication** — modules broadcast events rather than calling each other directly (using *delegates* (委托) or *callbacks* (回调))
4. **Subsystem pattern** — shared services are accessed through a global subsystem manager, avoiding tight coupling

> 句型解析: "Depend on abstractions — modules communicate through interfaces, not concrete classes" — 这是依赖倒转原则 (Dependency Inversion Principle) 的体现，模块之间通过抽象接口通信，而不是直接依赖具体实现。

## 8. Key Takeaways

- A multiplayer shooter uses a **client-server** model with an authoritative dedicated server
- The codebase is decomposed into **~10 major modules**, each with a single responsibility
- Architecture follows a **layered** pattern: Engine → Framework → Game Logic → Scripting
- **Data-driven design** separates game data from code, enabling rapid iteration
- **Cross-platform support** requires abstraction layers for input, rendering, and platform SDKs
- **Dependency management** relies on interfaces, events, and the subsystem pattern to keep modules *decoupled* (解耦的)
