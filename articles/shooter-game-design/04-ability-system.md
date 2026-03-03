---
layout: article
title: "Ability System Design"
description: "Data-driven ability framework — effects, attributes, target selection, cooldowns, and tag-based event system"
lang: en
level: advanced
tags: ["Ability System", "GAS", "Data-Driven"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 4
prev:
  title: "Weapon System Design"
  url: "03-weapon-system.html"
next:
  title: "UI Framework Design"
  url: "05-ui-framework.html"
---

## 1. Why a Dedicated Ability System?

In a modern shooter, characters do far more than shoot — they dash, heal, deploy shields, throw grenades, and activate *ultimates* (终极技能). Implementing each ability as custom code leads to an *unmaintainable* (难以维护的) mess. Instead, we need a **data-driven ability framework** — a general-purpose engine that can express any ability through configuration rather than code.

> 句型解析: "Implementing each ability as custom code leads to an unmaintainable mess" — 为每个技能单独编写代码会导致代码库变得混乱且难以维护，因此需要一个通用框架。

## 2. Layered Architecture

A well-designed ability system follows a **five-layer** architecture:

```
┌─────────────────────────────────────────────┐
│          Ability Layer (能力层)               │
│  Defines what skills a character can use     │
├─────────────────────────────────────────────┤
│          Effect Layer (效果层)                │
│  Applies buffs, debuffs, damage over time    │
├─────────────────────────────────────────────┤
│          Attribute Layer (属性层)             │
│  Numeric values: health, armor, speed        │
├─────────────────────────────────────────────┤
│        Target Selection Layer (选择层)        │
│  Finds targets: sphere, box, line trace      │
├─────────────────────────────────────────────┤
│         Execution Layer (执行层)              │
│  Calculates final values and applies them    │
└─────────────────────────────────────────────┘
```

Data flows downward: an **ability** triggers an **effect**, which modifies **attributes**, on **targets** found by selectors, using **calculations** to determine final values.

## 3. Ability Lifecycle

Every ability follows a *standardized* (标准化的) lifecycle:

```
1. PreActivate()     — check prerequisites (enough energy? cooldown ready?)
2. ActivateAbility() — begin the ability (play animation, spawn effects)
3. InputPressed()    — respond to continued input (charging, channeling)
4. InputReleased()   — respond to input release (throw grenade, release bow)
5. EndAbility()      — clean up (remove effects, start cooldown)
```

### Input Mapping

Each ability is bound to an **input ID** that maps to a physical button:

| Input ID | Typical Binding | Example Ability |
| --- | --- | --- |
| SkillQ | Q key / L1 button | Tactical ability (smoke, flash) |
| SkillE | E key / R1 button | Signature ability (dash, wall) |
| SkillX | X key / L1+R1 | Ultimate ability |
| Sprint | Shift / L3 | Sprint toggle |
| Jump | Space / A button | Jump / double jump |

### Press Duration Events

Some abilities behave differently based on how long the button is held:

- **Short press** (< threshold) — quick cast, e.g., throw grenade immediately
- **Long press** (> threshold) — charged cast, e.g., aim grenade trajectory then throw on release

This is implemented through a **press/release event system** with configurable time thresholds.

## 4. Gameplay Effects

Effects are the *workhorse* (主力) of the ability system — they modify attributes over time:

### Effect Types

| Type | Duration | Example |
| --- | --- | --- |
| Instant | One frame | Deal 50 damage |
| Duration | Timed | Speed boost for 5 seconds |
| Infinite | Until removed | Passive armor bonus |
| Periodic | Repeated | Poison: 10 damage every 2 seconds |

### Buff Classification

Effects are classified for UI and gameplay purposes:

| Category | Icon Color | Example |
| --- | --- | --- |
| Strong (增益) | Green | Healing, damage boost |
| Weak (减益) | Red | Slow, poison, blind |
| Both (混合) | Yellow | Trade-off: more damage but less armor |
| Neutral (中立) | Gray | Visual-only markers |

### Event Tags

Each effect can trigger **event tags** at different lifecycle points:

```
Effect Lifecycle Events:
├── OnAdded        — when the effect is first applied
├── OnExecuted     — each time the effect ticks (for periodic effects)
├── OnRemoved      — when the effect expires or is cleansed
│
├── Target Events  — fired on the character receiving the effect
└── Instigator Events — fired on the character who applied the effect
```

This enables chains like: "When a healing effect is applied, play a green particle on the target and increase the healer's assist counter."

> 句型解析: "Effects are the workhorse of the ability system" — "workhorse" (主力) 意为做最多工作的核心组件，效果系统承担了技能系统中大部分的实际工作。

## 5. Attribute Sets

Attributes are organized into **sets** — groups of related numeric values:

### Base Attribute Set

```
Health Group:        Health, HealthMax, TotalHealthMax
Armor Group:         Armor, ArmorMax, ExtraArmor, ExtraArmorMax
Damage Group:        CauseDamageFactor, TakeDamageFactor
Movement Group:      SpeedFactor, JumpSpeedFactor
Recovery Group:      HealthRecovery, ArmorRecovery, RecoveryFactor
```

### Specialized Attribute Sets

| Set | Purpose |
| --- | --- |
| Character Attributes | Per-character stats (role-specific bonuses) |
| Ability Attributes | Skill points, energy, cooldown modifiers |
| Summon Attributes | Stats for summoned units (turrets, drones) |
| 2D Energy Attributes | Energy for 2D locomotion modes |
| Melee Weapon Attributes | Block stamina, combo counters |

### Damage Calculation

When an effect deals damage, the calculation system determines how much each attribute pool absorbs:

```
Incoming Damage → Calculation Pipeline
    │
    ├── Check damage type mask:
    │   Health only? Armor only? All types?
    │
    ├── Apply damage scale (from data curves)
    │
    ├── Apply distance attenuation (if applicable)
    │
    └── Distribute damage:
        1. Extra Armor absorbs first
        2. Base Armor absorbs second
        3. Health takes the remainder
```

## 6. Target Selection

The system needs to find **who** or **what** an ability affects. This is handled by a *modular* (模块化的) target selection pipeline:

### Location Detectors

Determine *where* to look for targets:

| Detector | Description |
| --- | --- |
| Source Location | The ability user's current position |
| Owner Location | The owning actor's position |
| Raycast | A line trace from camera or weapon |
| Predict Path | A *parabolic* (抛物线的) trajectory (for thrown abilities) |
| Floor Detection | The ground beneath a point |

### Target Detectors

Determine *who* is within the area:

| Detector | Shape | Use Case |
| --- | --- | --- |
| Sphere | Radius | Area-of-effect healing, grenades |
| Box | Width × Height × Depth | Rectangular zones |
| Capsule | Radius + Half Height | Character-shaped detection |
| Line Trace | Start → End | Sniper bullets, laser abilities |
| View Angle | Cone | Forward-facing abilities |
| Distance | Radius only | Simple proximity check |

### Target Filters

After finding candidates, **filters** narrow the list:

| Filter | Effect |
| --- | --- |
| Different Team | Only enemies |
| Same Team | Only allies |
| Not Self | Exclude the caster |
| Full Health | Only undamaged targets |
| Attribute Check | Custom attribute conditions |

### Pipeline Example

A healing grenade might use:

```
Location: PredictPath (thrown arc)
   → Detector: Sphere (radius: 5m)
   → Filter: SameTeam + NotSelf
   → Effect: Heal 50 HP over 3 seconds
```

## 7. Tag-Based Condition System

The ability system uses **gameplay tags** — hierarchical string identifiers — to express complex conditions without code:

### Tag Structure

```
Character.State.Alive
Character.State.Injured
Character.State.Dead
Ability.Active.Healing
Ability.Cooldown.SkillQ
Status.Effect.Burning
Status.Effect.Frozen
Weapon.State.Reloading
```

### Tag Requirements

Abilities define which tags must be **present** or **absent** for activation:

```
Example — Dash Ability:
  Required Tags:   Character.State.Alive
  Blocked Tags:    Status.Effect.Frozen, Status.Effect.Stunned

Meaning: The character must be alive and not frozen or stunned.
```

### Tag Events

Tags can trigger reactive behavior:

```
When "Status.Effect.Burning" is added:
  → Play fire particle effect
  → Apply 10 damage per second

When "Status.Effect.Burning" is removed:
  → Stop fire particle
  → Play steam/smoke effect
```

> 句型解析: "Gameplay tags — hierarchical string identifiers — express complex conditions without code" — "hierarchical" (层级的) 意为标签按照树状结构组织，例如 Character.State.Alive 属于 Character.State 的子标签。

## 8. Cooldown and Cost System

### Cooldown

Each ability has an optional **cooldown effect** — a timed lockout that prevents *spamming* (滥用):

```
Activate Ability
    → Apply Cooldown Effect (duration: 8 seconds)
    → During cooldown: PreActivate() returns false
    → Cooldown expires: ability is available again
```

Cooldown can be:
- **Reduced** by attributes or buffs
- **Reset** by kill events or special conditions
- **Shared** across multiple abilities (global cooldown)

### Cost

Abilities can also require a **resource cost**:

| Resource | Example |
| --- | --- |
| Ability Points | Finite points that regenerate over time |
| Energy | Drained while the ability is channeled |
| Health | Self-damage abilities (sacrifice HP for power) |
| Ammo | Weapon-based abilities consume bullets |

An ability with `bEndByEnergy = true` automatically ends when the energy pool is *depleted* (耗尽).

## 9. Summon System

Some abilities create **summoned units** — turrets, drones, or AI-controlled characters:

```
Summon System:
├── Summon Character    — full character with abilities and attributes
├── Summon Pawn         — simplified AI unit (minion)
├── Summon Actor        — static objects (wall, trap, shield)
└── Team Actor          — team-owned objects (flags, beacons)
```

Summoned units:
- Inherit the summoner's team ID
- Have their own attribute set (health, damage)
- Can be controlled by lightweight AI
- Expire after a duration or when destroyed

## 10. Key Takeaways

- An ability system uses a **five-layer architecture**: Ability → Effect → Attribute → Target → Calculation
- The **ability lifecycle** (PreActivate → Activate → Input → End) standardizes all skills
- **Gameplay effects** modify attributes with support for instant, duration, infinite, and periodic timing
- **Target selection** combines location detectors, shape-based target detectors, and filters into a modular pipeline
- **Gameplay tags** provide a code-free condition system for activation requirements and reactive events
- **Cooldown and cost** systems prevent ability *spam* (滥用) and create resource management decisions
- The **summon system** extends abilities to create AI-controlled units and deployable objects
