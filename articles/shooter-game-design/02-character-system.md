---
layout: article
title: "Character System Design"
description: "Character hierarchy, component architecture, state machine, and 2D/3D locomotion modes in a multiplayer shooter"
lang: en
level: intermediate
tags: ["Character", "FSM", "Component Architecture"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 2
prev:
  title: "System Architecture Overview"
  url: "01-architecture-overview.html"
next:
  title: "Weapon System Design"
  url: "03-weapon-system.html"
---

## 1. Why Characters Matter

The character system is the *backbone* (骨干) of any shooter. Every player, bot, and NPC is ultimately a character. The character owns the weapon, triggers abilities, takes damage, and drives animation. A well-designed character system makes everything else — combat, networking, AI — significantly easier to build.

## 2. Inheritance Hierarchy

Characters in a multiplayer shooter are typically organized in a *layered inheritance* (分层继承) hierarchy:

```
Engine Base Character
    │
Framework Character Base
    │   (frame tick strategy, core lifecycle)
    │
Game Character Base
    │   (health, armor, components, interfaces)
    │
Player Character
    │   (input, camera, animation integration)
    │
Bot Character (optional)
        (AI-controlled, simplified input)
```

Each layer adds *incrementally* (逐步地) without overloading any single class:

| Layer | Adds |
| --- | --- |
| Engine Base | Physics, collision, skeletal mesh, movement component |
| Framework Base | Custom tick strategy — controls how often the character updates |
| Game Base | Health/armor attributes, state machine, weapon slot, ability system |
| Player | Input binding, camera management, advanced locomotion |

> 句型解析: "Each layer adds incrementally without overloading any single class" — "incrementally" 意为逐层增加功能，避免在某一个类中堆积过多职责。

## 3. Interface-Driven Design

Rather than relying on deep inheritance alone, a well-designed character implements multiple **interfaces** (接口):

| Interface | Purpose |
| --- | --- |
| Ability System Interface | Connects the character to the ability/skill framework |
| Gameplay Tag Interface | Allows querying and modifying gameplay tags on the character |
| Attribute Interface | Exposes health, armor, speed, and other numeric attributes |
| Weapon System Interface | Allows the weapon manager to interact with the character |
| Aim Assist Interface | Provides aim assist data for controller/mobile players |
| Anti-Cheat Interface | Exposes verification points for server-side validation |

Interfaces allow other systems to interact with the character *without knowing its concrete type* (不需要知道其具体类型). The AI system can query `GetHealth()` on any character — player or bot — through the Attribute Interface.

## 4. Component Architecture

Modern characters use a **component-based** design rather than putting everything into one massive class. Each component *encapsulates* (封装) a specific domain:

```
Character
├── Weapon Manager Component    — manages equipped weapons
├── Ability Manager Component   — manages active abilities
├── State Machine Component     — tracks character state (alive, injured, dead)
├── Life Component              — health and damage processing
├── Skin Component              — visual appearance and cosmetics
├── Animation Component         — animation state and montages
└── Rotation Component          — smooth rotation blending
```

### Benefits of Components

1. **Single responsibility** — each component handles exactly one concern
2. **Reusability** — the same Weapon Manager can be attached to players and bots
3. **Testability** — components can be tested in *isolation* (隔离)
4. **Hot-swapping** — components can be added or removed at runtime

## 5. Attribute System

Characters expose a set of **attributes** (属性) that other systems read and modify:

### Health & Armor

```
Health System:
├── Current Health      (当前血量)
├── Max Health          (最大血量)
├── Total Max Health    (绝对最大血量 — includes buffs)
│
├── Base Armor          (基础护甲)
├── Armor Max           (护甲上限)
├── Extra Armor         (临时护甲 — from abilities)
└── Armor-to-Health Ratio  (护甲转化率 — how armor absorbs damage)
```

### Combat Modifiers

```
Damage Modifiers:
├── Cause Damage Factor     (造成伤害系数 — multiplied on outgoing damage)
├── Take Damage Factor      (承伤系数 — multiplied on incoming damage)
├── Close-Range Factor      (近战伤害加成)
│
Movement Modifiers:
├── Speed Factor            (速度系数)
└── Jump Speed Factor       (跳跃速度系数)
```

These attributes are not hard-coded — they are defined as **data assets** and can be modified at runtime by abilities, buffs, and game mode rules.

> 句型解析: "These attributes are not hard-coded — they are defined as data assets" — "hard-coded" (硬编码) 意为直接写死在代码里。这里强调属性是通过数据资产定义的，可以灵活修改。

## 6. State Machine

A character's lifecycle is managed by a **finite state machine** (有限状态机, FSM):

```
                    ┌──────────┐
        ┌──────────▶│ Normal3D │◀──────────┐
        │           └────┬─────┘           │
        │                │                 │
   ┌────▼────┐     ┌─────▼─────┐     ┌────▼────┐
   │  Fly2D  │     │  Side2D   │     │ Wall2D  │
   └────┬────┘     └─────┬─────┘     └────┬────┘
        │                │                 │
        └────────┬───────┘                 │
                 │                         │
           ┌─────▼──────┐                  │
           │  Injured   │◀─────────────────┘
           └─────┬──────┘
                 │
           ┌─────▼──────┐     ┌──────────┐
           │   Death    │     │ Revival  │
           └─────┬──────┘     └────▲─────┘
                 └─────────────────┘
```

### State Properties

Each state carries metadata that controls game behavior:

| State | Crosshair | Input | Scoring | Description |
| --- | --- | --- | --- | --- |
| Normal3D | Yes | Full | Yes | Standard walking/running state |
| Fly2D | Yes | Limited | Yes | Character *flattens* (变平) and flies in 2D |
| Side2D | Yes | Limited | Yes | Sideways sliding in 2D |
| Wall2D | Yes | Limited | Yes | *Adhering* (附着) to a wall surface |
| Injured | No | None | No | Downed, waiting for rescue |
| Death | No | None | No | Dead, awaiting respawn |
| Revival | No | Partial | No | Being *revived* (复活) by a teammate |

### State Transition Rules

States have `AllowBegin()` and `AllowEnd()` guards that prevent invalid transitions. For example:

- You cannot enter `Fly2D` while `Injured`
- You cannot leave `Death` until the respawn timer *expires* (到期)
- Entering `Injured` from any active state triggers a knockdown animation

## 7. 2D/3D Locomotion Modes

A unique design challenge in some shooters is supporting **multiple locomotion modes** — the character can switch between 3D movement and 2D movement (flying, sliding, wall-climbing):

### Mode Switching

```
3D Mode (Normal)
    │
    ├── Trigger Fly ──▶ 2D Fly Mode
    │   (character flattens like paper, flies freely)
    │
    ├── Trigger Side ──▶ 2D Slide Mode
    │   (character slides along surfaces)
    │
    └── Trigger Wall ──▶ 2D Wall Mode
        (character adheres to vertical surfaces)
```

Each mode has its own movement rules, camera behavior, and input mapping. The state machine ensures only one mode is active at a time and manages the *transition* (过渡) animations between modes.

### Network Replication

Mode switches must be *replicated* (同步) across the network:

- The server validates that the mode switch is legal
- Flag variables (e.g., `WantsToFly2D`) are replicated to all clients
- Clients play the corresponding transition animation locally

## 8. Damage Processing Pipeline

When a character takes damage, it flows through a multi-stage pipeline:

```
Incoming Damage
    │
    ▼
Apply Attacker Modifiers (CauseDamageFactor)
    │
    ▼
Apply Defender Modifiers (TakeDamageFactor)
    │
    ▼
Check Hit Zone (head × headshot multiplier, body × 1.0, legs × leg factor)
    │
    ▼
Apply Distance Attenuation (damage drops off with range)
    │
    ▼
Distribute to Armor / Health
    │   ├── Extra Armor absorbs first
    │   ├── Base Armor absorbs second
    │   └── Health takes the remainder
    │
    ▼
Check Thresholds
    ├── Health > 0 → Stay alive
    ├── Health ≤ 0 and has "injured" ability → Enter Injured state
    └── Health ≤ 0 → Enter Death state
```

> 句型解析: "When a character takes damage, it flows through a multi-stage pipeline" — "pipeline" (流水线) 是一种设计模式，数据按顺序经过多个处理阶段，每个阶段负责一种变换。

## 9. Key Takeaways

- Characters use a **layered inheritance** hierarchy — each layer adds specific responsibilities
- **Interfaces** decouple the character from other systems (abilities, weapons, AI)
- **Components** encapsulate distinct domains (weapon management, state, animation)
- A **data-driven attribute system** makes health, armor, and modifiers configurable
- A **finite state machine** manages the character lifecycle (normal, injured, dead, revival)
- **2D/3D mode switching** adds unique locomotion variety, managed through replicated state flags
- The **damage pipeline** processes damage through multiple stages: modifiers → hit zone → attenuation → distribution
