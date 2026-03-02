---
layout: article
title: "Football Game Architecture Patterns"
description: "Common software architecture patterns used in football game development — ECS, state machines, event systems, and data-driven design"
lang: en
level: intermediate
tags: ["Architecture", "Design Patterns", "Technical"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 8
prev:
  title: "Football Game AI Design"
  url: "07-ai-design.html"
next:
  title: "Ball Physics & Player Movement"
  url: "09-ball-physics.html"
---

## 1. Overview

A football game is a complex real-time simulation with dozens of *interacting systems* (交互系统): physics, AI, animation, input, audio, rendering, networking, and more. Choosing the right **architecture patterns** determines how *maintainable* (可维护的), *extensible* (可扩展的), and performant your codebase will be.

This article covers the most common patterns found in football game engines.

## 2. Entity-Component-System (ECS)

The **ECS** pattern is widely used in modern game engines, and it fits football games particularly well because you have many similar entities (22 players + ball + referee) that share some behaviors but differ in others.

### Core Concepts

- **Entity** (实体): A unique ID — a player, the ball, a goal post
- **Component** (组件): Raw data attached to an entity — `Position`, `Velocity`, `PlayerAttributes`, `TeamAffiliation`
- **System** (系统): Logic that operates on entities with specific component combinations

```
// Components
struct Position { float x, y, z; };
struct Velocity { float vx, vy, vz; };
struct PlayerAttributes { int pace, shooting, passing, ...; };
struct BallOwnership { entity_id owner; };
struct TeamMembership { int team_id; };

// Systems
MovementSystem:    queries (Position, Velocity) → updates Position
AIDecisionSystem:  queries (Position, PlayerAttributes, TeamMembership) → updates AI state
PhysicsSystem:     queries (Position, Velocity, Collider) → resolves collisions
AnimationSystem:   queries (Position, Velocity, AnimState) → updates animations
```

### Why ECS Works for Football

- **Uniform entities**: All players share the same base components but differ in attribute values
- **Cache-friendly**: Component data is stored *contiguously* (连续地) in memory, improving performance
- **Easy to add features**: Adding a new behavior means adding a new component + system, without modifying existing code
- **Parallelizable**: Systems that don't share write access to components can run *concurrently* (并发地)

> 句型解析: "Component data is stored contiguously in memory, improving performance" — "contiguously" 意为"连续地、相邻地"，指数据在内存中紧挨着存储，有利于CPU缓存命中。

## 3. State Machine Patterns

Football games use state machines at multiple levels:

### Match State Machine

Controls the overall flow of the match:

```
enum MatchState {
    PreMatch,       // team sheets, coin toss
    KickOff,        // waiting for kick-off
    InPlay,         // normal play
    FreeKick,       // direct or indirect free kick
    CornerKick,     // corner kick setup
    ThrowIn,        // throw-in
    GoalKick,       // goal kick
    PenaltyKick,    // penalty
    GoalCelebration,// goal scored animation
    HalfTime,       // half-time break
    FullTime,       // match ended
    ExtraTime,      // additional time
    PenaltyShootout // penalty shootout
}
```

### Player State Machine

Each player has their own FSM for physical actions:

```
enum PlayerState {
    Idle,
    Running,
    Sprinting,
    Dribbling,
    Passing,
    Shooting,
    Tackling,
    Heading,
    Falling,
    GettingUp,
    Celebrating,
    Injured
}
```

### Hierarchical State Machine (HFSM)

For complex behavior, states can contain *sub-states* (子状态):

```
Attacking (top-level state)
├── BuildUp
│   ├── ShortPassing
│   ├── LongBall
│   └── Dribbling
├── FinalThird
│   ├── Crossing
│   ├── ThroughBall
│   └── SettingUpShot
└── Finishing
    ├── Shooting
    ├── Header
    └── Volley
```

This *hierarchical* (层级式的) approach keeps state management organized as complexity grows.

## 4. Event System

Football games generate many events that multiple systems need to react to. An **event-driven architecture** (事件驱动架构) *decouples* (解耦) the event producer from consumers.

### Common Events

```
// Match events
MatchStarted, HalfTimeReached, FullTimeReached
GoalScored { team_id, scorer_id, assist_id, minute }
FoulCommitted { offender_id, victim_id, severity, position }
CardShown { player_id, card_type }
SubstitutionMade { team_id, player_out, player_in }

// Ball events
BallPassed { from_id, to_id, pass_type }
BallShot { shooter_id, power, direction, spin }
BallOutOfPlay { last_touch_team, exit_point, restart_type }

// Player events
PlayerInjured { player_id, severity }
OffsideDetected { player_id, position }
```

### Event Bus Pattern

```
class EventBus {
    subscribers: Map<EventType, List<Callback>>
    
    function subscribe(event_type, callback):
        subscribers[event_type].add(callback)
    
    function publish(event):
        for callback in subscribers[event.type]:
            callback(event)
}

// Usage
event_bus.subscribe(GoalScored, commentarySystem.onGoal)
event_bus.subscribe(GoalScored, crowdSystem.onGoal)
event_bus.subscribe(GoalScored, scoreboardUI.onGoal)
event_bus.subscribe(GoalScored, statisticsTracker.onGoal)
event_bus.subscribe(GoalScored, replaySystem.onGoal)
```

When a goal is scored, **one event** triggers commentary, crowd reactions, scoreboard updates, statistics, and replay capture — all without these systems knowing about each other.

## 5. Data-Driven Design

Football games benefit enormously from **data-driven design** — separating data from logic so that designers can tune the game without code changes.

### Configuration Files

```yaml
# formations.yaml
formations:
  - name: "4-4-2"
    positions:
      - { role: GK,  x: 50, y: 5 }
      - { role: CB,  x: 35, y: 25 }
      - { role: CB,  x: 65, y: 25 }
      # ...

# difficulty.yaml
difficulty_levels:
  amateur:
    ai_reaction_delay_ms: 400
    pass_error_multiplier: 1.8
    shot_error_multiplier: 2.0
    decision_quality: 0.4
  professional:
    ai_reaction_delay_ms: 100
    pass_error_multiplier: 1.0
    shot_error_multiplier: 1.0
    decision_quality: 0.85
```

This approach lets designers *iterate* (迭代) on gameplay balance without recompiling the game.

## 6. Command Pattern

Player input and AI actions can both be *encapsulated* (封装) as **commands**:

```
interface GameCommand {
    function execute(context)
    function canExecute(context) -> bool
}

class PassCommand implements GameCommand {
    target_player: Entity
    pass_type: PassType
    
    function execute(context):
        calculate_pass_trajectory(context.player, target_player, pass_type)
        apply_ball_physics(trajectory)
        trigger_animation(context.player, "pass_" + pass_type)
}

class ShootCommand implements GameCommand {
    direction: Vector3
    power: float
    
    function canExecute(context):
        return context.player.hasBall 
            and context.player.state != Falling
}
```

### Benefits for Football Games

- **Input abstraction**: Human input and AI decisions produce the same command objects
- **Replay system**: Record commands with timestamps → replay by re-executing them
- **Network play**: Send commands over the network instead of raw input
- **Undo support** (for management games): *Revert* (撤销) tactical changes

> 句型解析: "Human input and AI decisions produce the same command objects" — 意为人类操作和AI决策产生相同格式的命令对象，从而统一了游戏逻辑的处理方式。

## 7. Observer Pattern for UI

UI systems in football games need to react to game state changes without *tightly coupling* (紧耦合) to the simulation:

```
// Game simulation publishes state
match.onScoreChanged → scoreboard.update(home, away)
player.onStaminaChanged → staminaBar.update(value)
match.onMinuteChanged → clock.update(minute)
match.onFormationChanged → minimap.redraw()
```

This is closely related to the event system but focused on **presentation** rather than game logic.

## 8. System Update Order

In a football game, systems must update in a specific order each frame:

```
Frame Update Pipeline:

1. Input System         ← read controller / keyboard
2. Network System       ← receive remote inputs
3. AI System            ← make decisions for AI players
4. Command Processor    ← execute all queued commands
5. Physics System       ← move entities, resolve collisions
6. Animation System     ← blend and update animations
7. Camera System        ← follow ball / active player
8. Audio System         ← trigger sound effects
9. UI System            ← update HUD elements
10. Render System       ← draw the frame
```

Getting this order wrong causes *one-frame-off* (差一帧) bugs — e.g., the ball appears to pass through a player because collision was checked before movement was applied.

## 9. Module Boundaries

A well-structured football game separates concerns into clear modules:

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│   Core Sim  │  │  Presentation │  │   Platform   │
├─────────────┤  ├──────────────┤  ├──────────────┤
│ Match Engine│  │ Renderer     │  │ Input        │
│ Physics     │  │ Animation    │  │ Audio        │
│ AI          │  │ Camera       │  │ Network      │
│ Rules       │  │ UI / HUD     │  │ File I/O     │
│ Statistics  │  │ Commentary   │  │ Save/Load    │
└─────────────┘  └──────────────┘  └──────────────┘
```

The **Core Sim** should be *platform-independent* (平台无关的) — it can run on any platform, headlessly for testing, or on a server for online matches.

## 10. Key Takeaways

- **ECS** fits football games naturally — uniform entities with varying data
- **State machines** manage match flow and player actions at multiple levels
- **Event systems** decouple game events from the many systems that react to them
- **Data-driven design** lets designers tune formations, difficulty, and balance without code changes
- **Command pattern** unifies human input and AI decisions, enabling replay and networking
- System **update order** matters — incorrect ordering causes subtle physics and visual bugs
