---
layout: article
title: "Weapon System Design"
description: "Weapon hierarchy, state machine, component-based architecture, shooting mechanics, and attachment system design"
lang: en
level: intermediate
tags: ["Weapon", "FSM", "Shooting Mechanics"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 3
prev:
  title: "Character System Design"
  url: "02-character-system.html"
next:
  title: "Ability System Design"
  url: "04-ability-system.html"
---

## 1. The Role of the Weapon System

In a shooter, the weapon is the primary *medium* (媒介) through which players interact with the game world. A well-designed weapon system must support:

- Multiple weapon categories with distinct *feel* (手感)
- Smooth state transitions (equip, fire, reload, holster)
- Precise shooting mechanics (spread, recoil, damage falloff)
- A modular attachment system for *customization* (自定义)
- Network synchronization for multiplayer *consistency* (一致性)

## 2. Weapon Type Hierarchy

Weapons form a natural *inheritance* (继承) tree based on their behavior:

```
Base Weapon
├── Pistol              (semi-auto, fast switch)
├── Rifle               (full-auto, moderate recoil)
├── Sniper Rifle        (bolt-action, high zoom)
├── Shotgun             (spread pattern, close range)
├── Melee Weapon        (no ammo, combo attacks)
├── Bow                 (charge-based, projectile)
├── Throwable           (grenades, tactical items)
├── Flame Weapon        (continuous damage, area effect)
└── Custom Weapon       (character-specific abilities)
```

The **base weapon class** provides shared behavior: equip/unequip, state machine, attack interface, and network replication. Each *subclass* (子类) overrides specific behavior — a sniper rifle has bolt-action mechanics, while a melee weapon uses combo chains.

> 句型解析: "Each subclass overrides specific behavior" — "override" (重写) 在面向对象设计中指子类替换父类的默认实现，使每种武器有独特的行为。

## 3. Weapon State Machine

Every weapon runs its own **finite state machine** (有限状态机) to manage its lifecycle:

```
┌────────┐     ┌────────┐     ┌──────────┐
│ Entry  │────▶│ Equip  │────▶│  Work    │◀──────────┐
└────────┘     └────────┘     └────┬─────┘           │
                                   │                  │
                    ┌──────────────┼──────────────┐   │
                    │              │              │   │
              ┌─────▼───┐   ┌─────▼───┐   ┌─────▼───┤
              │ Attack  │   │ Reload  │   │PullBolt │
              └─────┬───┘   └─────┬───┘   └─────┬───┘
                    │             │             │
                    └──────┬──────┘             │
                           │                    │
                    ┌──────▼──────┐             │
                    │   Work      │◀────────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  UnEquip   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ UnEquipped  │
                    └─────────────┘
```

### State Properties

Each state carries timing and *constraint* (约束) data:

| State | Duration | Allowed Movement | Description |
| --- | --- | --- | --- |
| Entry | Instant | Full | Initial state when weapon is created |
| Equip | ~0.5s | Walk only | Playing the draw animation |
| Work | Indefinite | Full | Idle, ready to fire or switch |
| Attack | Varies | Depends on weapon | Firing — blocks other actions |
| ReloadStart | ~0.3s | Walk only | Magazine *ejection* (退弹) animation |
| Reload | ~1.5s | Walk only | Inserting new magazine |
| ReloadEnd | ~0.3s | Walk only | *Chambering* (上膛) a round |
| PullBolt | ~0.8s | Walk only | Bolt-action *cycling* (循环拉栓) |
| UnEquip | ~0.3s | Walk only | Holstering the weapon |

Each state defines `AllowBegin()` and `AllowEnd()` guards. For example, you cannot interrupt `ReloadEnd` (the player would lose their ammo if the chambering is cancelled).

## 4. Component-Based Weapon Architecture

Rather than placing all logic in the weapon class, a component-based approach keeps things *maintainable* (可维护的):

```
Weapon
├── Attack Component         — handles hit detection, damage calculation
│   ├── Fire Component       — ranged weapon firing (extends Attack)
│   ├── Melee Component      — melee combo attacks
│   ├── Throw Component      — grenade/throwable logic
│   └── Flame Component      — continuous flame damage
│
├── Effect Component         — muzzle flash, tracer, impact particles
├── Predict Path Component   — trajectory prediction for projectiles
│
└── Parts (Attachment System)
    ├── Magazine Part        — ammo count, reload state
    ├── Sight Part           — scope zoom level
    ├── Muzzle Part          — suppressor, flash hider
    ├── Stock Part            — recoil reduction
    ├── Grip Part            — spread reduction
    └── Pendant Part         — cosmetic charms
```

## 5. Shooting Mechanics

The core shooting loop involves three key processors:

### 5.1 Spread (散射)

**Spread** determines how far bullets *deviate* (偏离) from the crosshair center:

```
Total Spread = Base Spread
             × Hold Type Scale    (aiming reduces spread)
             × Locomotion Scale   (moving increases spread)
             × Accuracy Factor    (character skill modifier)
             × Weapon Factor      (per-weapon tuning)
```

| Hold Type | Spread Multiplier | Description |
| --- | --- | --- |
| Hip Fire | 1.0× | Default, widest spread |
| Shoulder Aim | 0.6× | Moderate *tightening* (收紧) |
| ADS (Scope) | 0.2× | Tightest spread |

| Movement State | Spread Multiplier |
| --- | --- |
| Standing Still | 1.0× |
| Walking | 1.3× |
| Running | 1.8× |
| Jumping / Airborne | 2.5× |

### 5.2 Recoil (后坐力)

**Recoil** moves the player's aim after each shot:

```
Per-Shot Recoil:
├── Vertical Component     (always kicks upward)
│   └── VerticalRecoil × VerticalFactor
│
└── Horizontal Component   (kicks left or right)
    └── HorizontalRecoil × HorizontalFactor
        (with random direction variation)

Recovery:
└── After firing stops, the recoil processor
    gradually returns the aim to its original position
    over a configurable recovery time
```

The key design insight is that recoil should be **learnable** — skilled players can *compensate* (补偿) by pulling the mouse in the opposite direction. The recoil pattern should be *deterministic* (确定性的) enough to reward practice, but with slight randomness to prevent perfect spray control.

> 句型解析: "The recoil pattern should be deterministic enough to reward practice, but with slight randomness to prevent perfect spray control" — 后坐力模式应该足够确定，使得练习有回报，但又有轻微随机性，防止完美控枪。

### 5.3 Damage Attenuation (伤害衰减)

Damage typically *falls off* (衰减) over distance:

```
Effective Damage = Base Damage × Attenuation Curve(distance)

Example curve:
Distance (m):   0    10    20    30    50    80
Multiplier:    1.0   1.0   0.9   0.7   0.4   0.2
```

Different weapon types have different *attenuation profiles* (衰减曲线):

- **Sniper rifles** — minimal falloff, effective at all ranges
- **Shotguns** — extreme falloff, only effective close-range
- **Rifles** — moderate falloff, effective at medium range
- **SMGs** — noticeable falloff, best at close-to-medium range

## 6. Hit Zone System

Damage is *multiplied* (乘以倍数) based on which body part is hit:

| Zone | Multiplier | Example |
| --- | --- | --- |
| Head | 2.0–4.0× | Headshots are heavily rewarded |
| Upper Body | 1.0× | Standard damage baseline |
| Lower Body | 0.7–0.8× | Legs take reduced damage |
| Limbs | 0.5–0.6× | Arms and hands take minimal damage |

The multipliers are defined per-weapon — a sniper rifle headshot might be a one-shot kill (4.0×), while a pistol headshot is less *devastating* (毁灭性的) (2.0×).

## 7. Attachment System

Weapons support a **modular attachment system** where parts modify weapon attributes:

### Attachment Slots

| Slot | Effect Category |
| --- | --- |
| Magazine | Ammo capacity, reload speed |
| Sight | Zoom level, ADS speed |
| Muzzle | Recoil reduction, sound *suppression* (消音) |
| Stock | Recoil pattern stability |
| Grip | Spread reduction, ADS speed |

### Attribute Modifier Structure

Each attachment applies a set of *modifiers* (修改器) to the weapon:

```
Attachment Modifier:
├── Damage modifiers
│   ├── Damage Factor
│   ├── Headshot Factor
│   └── Attenuation Factor
│
├── Spread modifiers
│   ├── Min Spread Factor
│   ├── Max Spread Factor
│   └── In-Air Spread Factor
│
├── Recoil modifiers
│   ├── Horizontal Recoil Factor
│   └── Vertical Recoil Factor
│
├── Speed modifiers
│   ├── Fire Rate Factor
│   ├── Reload Speed Factor
│   ├── Equip Speed Factor
│   └── ADS Speed Factor
│
└── Capacity modifiers
    └── Magazine Capacity Bonus
```

Modifiers are applied *multiplicatively* (乘法叠加), so a grip that reduces spread by 15% sets `SpreadFactor = 0.85`.

## 8. Aiming System

The weapon system supports multiple **hold types** (持枪姿态) that affect spread, camera, and animation:

```
Relaxed → Ready → Hip Aim → Shoulder Aim → ADS Level 1 → ADS Level 2+
  (idle)  (alert) (default)  (tighter)     (scope)       (higher zoom)
```

Each hold type defines:

- **Field of View** (FOV) — zooms in as you aim down sights
- **Camera distance** — pulls closer to the character
- **Spread scale** — tighter aim means less spread
- **Movement speed** — aiming slows you down

The transition between hold types is *interpolated* (插值的) smoothly to avoid jarring camera jumps.

## 9. Network Synchronization

Weapon actions must be *synchronized* (同步) across the network:

### Client → Server

When the player fires, the client sends an attack event containing:
- Fire point and bullet direction
- Current spread and hold type
- Attack index (sequence number for *ordering* (排序))

### Server Validation

The server validates the attack:
- Is the weapon in a valid state to fire?
- Does the player have enough ammo?
- Are the fire point and direction *plausible* (合理的)?

### Server → All Clients

After validation, the server broadcasts the event to all clients for visual effects (muzzle flash, tracers, impact particles).

## 10. Key Takeaways

- Weapons form an **inheritance hierarchy** with a shared base providing state machine, equip/unequip, and replication
- A **finite state machine** manages the weapon lifecycle: equip → work → attack/reload → unequip
- **Components** separate concerns: attack logic, visual effects, trajectory prediction
- Shooting is governed by three core processors: **spread**, **recoil**, and **damage attenuation**
- The **hit zone system** rewards accurate aiming with multiplied damage
- A **modular attachment system** modifies weapon attributes through multiplicative factors
- All weapon actions are **network-replicated** with server-side validation
