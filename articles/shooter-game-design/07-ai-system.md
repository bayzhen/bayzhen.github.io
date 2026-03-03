---
layout: article
title: "AI System Design"
description: "Dual-layer AI architecture — behavior trees, perception, parametric AI, dynamic difficulty, and game mode adaptation"
lang: en
level: advanced
tags: ["AI", "Behavior Tree", "Dynamic Difficulty"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 7
prev:
  title: "Gameplay & Game Mode Design"
  url: "06-gameplay-modes.html"
next:
  title: "Network Architecture Design"
  url: "08-network-architecture.html"
---

## 1. AI in a Multiplayer Shooter

AI bots in a shooter serve multiple purposes:

- **Fill empty slots** when not enough human players are available
- **Provide practice opponents** for new players
- **Backfill disconnected players** to keep matches balanced
- **Scale difficulty** to create a smooth learning curve

The AI must be good enough to feel like a real player, but not so good that it *frustrates* (使沮丧) human players. This balance is the central design challenge.

## 2. Dual-Layer Architecture

A production-grade shooter AI uses a **dual-layer** approach:

```
┌─────────────────────────────────────────────┐
│        Layer 2 — Parametric AI               │
│   (Cloud-based / server-side decisions)      │
│   Dynamic difficulty, learned strategies     │
│   Update rate: per-tick (when available)      │
├─────────────────────────────────────────────┤
│        Layer 1 — Local AI                    │
│   (Client/server behavior trees)             │
│   Perception, navigation, shooting           │
│   Update rate: every frame                    │
└─────────────────────────────────────────────┘
```

| Layer | Strength | Weakness |
| --- | --- | --- |
| **Local AI** | Fast, reliable, works offline | Static behavior, limited *adaptability* (适应性) |
| **Parametric AI** | Adaptive, dynamic, learns from data | Requires server, network *latency* (延迟) |

When the parametric AI service is unavailable, the system *falls back* (回退) to the local AI seamlessly.

> 句型解析: "When the parametric AI service is unavailable, the system falls back to the local AI seamlessly" — "falls back" (回退) 意为在主要系统不可用时，自动切换到备用系统，"seamlessly" (无缝地) 意为切换对玩家不可见。

## 3. Local AI — Behavior Trees

The local AI layer uses **behavior trees** — a hierarchical structure of tasks, conditions, and actions:

### Tree Structure

```
Root (Selector)
│
├── HasEnemy? (Sequence)
│   ├── HasLineOfSight? ──▶ Engage Target
│   │   ├── InRange? ──▶ Fire Weapon
│   │   ├── NeedReload? ──▶ Take Cover + Reload
│   │   └── LowHealth? ──▶ Retreat
│   │
│   └── NoLineOfSight? ──▶ Chase or Flank
│       ├── CanFlank? ──▶ Flank Route
│       └── Default ──▶ Direct Chase
│
├── OnPatrol? (Sequence)
│   ├── HasPatrolPath? ──▶ Follow Patrol Points
│   └── Default ──▶ Find Random Location
│
└── Idle (Fallback)
    └── Return to Assigned Position
```

### Node Types

| Type | Purpose | Example |
| --- | --- | --- |
| **Selector** | Try children until one succeeds | "Do I fight or patrol?" |
| **Sequence** | Run children in order, stop on failure | "Check ammo → aim → fire" |
| **Task** | Execute a single action | "Move to cover point" |
| **Service** | Background update running in parallel | "Update enemy tracking" |
| **Decorator** | Condition gate on a branch | "Only if health > 30%" |

### Key Tasks

| Task | What It Does |
| --- | --- |
| Find Patrol Points | Generates waypoints along a patrol path |
| Find Random Location | Picks a random *navigable* (可导航的) position |
| Find Pickup | Locates ammo, health packs, or dropped weapons |
| Change Chase Status | Transitions between patrol → search → chase |
| Update AI Rotation | Smoothly rotates toward the target |

### Key Services

| Service | Update Rate | What It Does |
| --- | --- | --- |
| Select Action | Every 0.5s | Evaluates the best high-level action |
| Fire Control | Every frame | Controls trigger timing and aim |
| Set Focus | Every 0.3s | Sets the look-at target |
| Use Grenade | Event-driven | Decides when to throw *tactical items* (战术道具) |

## 4. Perception System

AI bots "see" and "hear" the world through a **perception system** with multiple senses:

### Sense Types

| Sense | Detection Method | Range | Key Parameters |
| --- | --- | --- | --- |
| **Sight** | Cone-shaped vision | 30–50m | View angle, max distance |
| **Hearing** | Sound event radius | 10–30m | Loudness threshold |
| **Damage** | Hit notification | Infinite | Any received damage |

### Perception Update Flow

```
OnPerceptionUpdated()
    │
    ├── CheckSightSense()     — scan for visible enemies
    ├── CheckHearingSense()   — react to gunshots, footsteps
    ├── CheckDamageSense()    — respond to incoming hits
    │
    └── RefreshEnemyTarget()  — update the current target
        ├── Prioritize closest visible enemy
        ├── Fall back to last-known damage source
        └── Clear target if all senses expire
```

### Blackboard Variables

The perception system writes results to a **blackboard** — a shared data store that behavior tree nodes read:

| Variable | Type | Updated By |
| --- | --- | --- |
| EnemyTarget | Object | Perception system |
| ChaseStatus | Enum | Patrol/Search/Chase state |
| HasLineOfSight | Bool | Sight sense check |
| EnableMove | Bool | Game state controller |
| EnableAttack | Bool | Game state controller |
| NeedAmmo | Bool | Weapon manager |

## 5. Navigation

AI bots need to navigate complex 3D environments. The navigation system uses a **NavMesh** with custom area types:

| Area Type | Movement Behavior |
| --- | --- |
| Navigable | Standard walking |
| Climb | Vertical climbing (ladders, walls) |
| Jump | Gap jumping (*leaping* (跳跃) across spaces) |
| Glide | Aerial gliding (if the game supports it) |
| Parkour | Advanced movement (wall runs, vaults) |

### Navigation Links

Special **link proxies** connect NavMesh areas that are not directly walkable:

```
Standard NavMesh ──[Jump Link]──▶ Elevated Platform
Ground Level ──[Climb Link]──▶ Rooftop
Rooftop ──[Glide Link]──▶ Distant Building
Wall ──[Parkour Link]──▶ Window Ledge
```

Each link type has custom movement logic — the jump link triggers a jump animation, the climb link plays a climbing *montage* (蒙太奇动画), etc.

## 6. Parametric AI

The second layer is a **parametric AI engine** that makes higher-level decisions using server-side computation:

### Architecture

```
Game State Collection
    │
    ├── Player state (position, health, weapon)
    ├── Camera state (view direction, FOV)
    ├── Weapon state (ammo, reload status)
    ├── Skill state (cooldowns, energy)
    ├── Sense info (visible enemies, sounds)
    └── Game state (score, round time, objectives)
    │
    ▼
Network Transmission (Protobuf)
    │
    ▼
Parametric AI Server (cloud)
    │
    ▼
Action Response
    │
    ├── Focus (look at target)
    ├── Move (direction + speed)
    ├── Fire (timing + target)
    ├── Reload
    ├── Switch Weapon
    ├── Use Skill (+ movement)
    └── Objective Action (plant/defuse bomb)
```

### Incremental Updates

To reduce network *bandwidth* (带宽), the system uses **differential updates** (增量更新):

- First message sends the full state
- Subsequent messages only send *changes* (差异) from the previous state
- If a packet is lost, the system marks it and sends a full state next time

```
Status Tracking:
├── Send     — packet transmitted, waiting for response
├── Receive  — response received, apply actions
├── Lost     — packet lost, mark for resend
└── Error    — something went wrong, send full state
```

> 句型解析: "To reduce network bandwidth, the system uses differential updates" — "differential updates" (差异更新/增量更新) 只发送与上次不同的数据，大幅减少网络流量。

## 7. Dynamic Difficulty

The AI adjusts its skill level based on the match situation:

### Difficulty Levels

| Level | Aim Accuracy | Decision Speed | Tactical Depth |
| --- | --- | --- | --- |
| Easy | 20–30% | Slow | Basic (patrol, chase) |
| Normal | 40–60% | Moderate | Standard (flank, cover) |
| Hard | 70–85% | Fast | Advanced (coordinated pushes) |

### Dynamic Adjustment

The system monitors match *metrics* (指标) and adjusts difficulty mid-game:

```
Adjustment Triggers:
├── Score gap too large → reduce AI difficulty
├── Human players struggling → lower AI aggression
├── Match too one-sided → boost losing team's AI
└── Player disconnects → replace with matched-skill AI
```

### Hit Rate Control

Rather than making the AI "miss on purpose," the system controls accuracy through **aim offset distribution** (瞄准偏移分布):

```
Hit Calculation:
├── Determine if this shot should hit (based on difficulty %)
├── If HIT:  aim at target center with small random offset
├── If MISS: aim at target with large deliberate offset
└── Apply per-weapon accuracy modifiers
```

This creates natural-looking misses — bullets fly *near* the target, not wildly off-screen.

## 8. Game Mode Adaptation

The AI system adapts to different game modes:

| Mode | Special AI Behavior |
| --- | --- |
| **Bomb Defusal** | AI decides between planting and defending based on role |
| **Team Deathmatch** | AI uses *aggression* (进攻性) based on score difference |
| **Escort** | AI prioritizes payload proximity on attack, intercept on defense |
| **Mining** | AI balances between mining resources and combat |
| **Hot Zone** | AI contests zones based on strategic value |

Each mode provides mode-specific data to the AI (bomb position, payload progress, zone ownership), allowing the behavior tree and parametric AI to make *informed* (有依据的) decisions.

## 9. Performance Optimization

AI computation is expensive. A frame budget of ~3ms means the system must be *frugal* (节俭的):

### Frame Distribution

```
Frame 1: Collect AI state data (~2.7ms)
Frame 2: Continue collection + send network data (~0.3ms)
Frame 3: Process received actions from parametric server
```

### Optimization Techniques

| Technique | Benefit |
| --- | --- |
| Frame distribution | Spread work across multiple frames |
| Memory pooling | Reuse allocated memory for state data |
| Weak references | Avoid holding strong references to game objects |
| Conditional updates | Only update perception for nearby enemies |
| LOD (Level of Detail) | Simpler AI for distant/off-screen bots |

## 10. Key Takeaways

- A **dual-layer architecture** combines reliable local AI with adaptive cloud-based parametric AI
- **Behavior trees** provide a hierarchical, *debuggable* (可调试的) structure for individual decision-making
- The **perception system** simulates sight, hearing, and damage awareness through configurable senses
- **Navigation** supports standard walking plus climbing, jumping, gliding, and parkour through link proxies
- **Parametric AI** sends game state to a server and receives action commands, with incremental updates for efficiency
- **Dynamic difficulty** adjusts AI skill in real-time based on match metrics — not just stat boosts
- AI behavior **adapts to game modes** by receiving mode-specific data (bomb state, payload progress, zone control)
- **Performance optimization** distributes AI work across frames with a strict time budget
