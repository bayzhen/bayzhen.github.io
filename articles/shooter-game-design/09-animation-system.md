---
layout: article
title: "Animation System Design"
description: "Event-driven animation, notify system, weapon animation state machine, locomotion integration, and performance optimization"
lang: en
level: intermediate
tags: ["Animation", "Locomotion", "State Machine"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 9
prev:
  title: "Network Architecture Design"
  url: "08-network-architecture.html"
---

## 1. Animation in a Shooter

Animation is what makes a shooter feel *visceral* (有冲击力的). The difference between a "good" and "great" shooter often comes down to how responsive and *polished* (精致的) the animations feel — weapon sway, recoil kick, movement blending, and hit reactions.

A shooter's animation system must handle:

- **Character locomotion** — walk, run, sprint, jump, crouch, slide
- **Weapon animations** — equip, fire, reload, inspect
- **Ability animations** — skill casting, channeling, recovery
- **State transitions** — seamless blending between all of the above
- **Network synchronization** — all players see consistent animations

## 2. Event-Driven Architecture

The animation system uses an **event-driven** architecture built on **animation notifies** — events embedded in animation timelines:

```
Animation Blueprint
    │
    ▼
Animation plays frame by frame
    │
    ├── Frame 12: AnimNotify_TriggerAttack fires
    │   └── Game logic: perform hit detection
    │
    ├── Frame 24: AnimNotify_PlayEffect fires
    │   └── VFX: spawn muzzle flash particle
    │
    ├── Frame 30-45: AnimNotifyState_AttachItem active
    │   └── Prop: attach magazine to hand
    │
    └── Frame 60: Animation ends
```

### Notify Types

| Type | Behavior | Example |
| --- | --- | --- |
| **Instant Notify** | Fires once at a specific frame | Trigger attack, play sound |
| **State Notify** | Active over a range of frames (Begin → Tick → End) | Attach/detach props, change camera height |

> 句型解析: "Events embedded in animation timelines" — "embedded" (嵌入的) 意为将事件标记直接放置在动画的时间轴上，当动画播放到该帧时自动触发事件。

## 3. Attack Notify System

The most critical notify is the **attack trigger** — it tells the game exactly when to perform hit detection:

### Design Principles

- The attack notify fires at the **visual moment** of impact — when the muzzle flashes or the blade swings
- An `AttackOffset` parameter allows *fine-tuning* (微调) the timing without re-editing the animation
- The notify only triggers game logic — visual effects are handled by separate notify types

### Location-Based Effects

Some abilities spawn effects at specific world positions:

```
Play Mode Options:
├── Default    — play at the notify's position in the animation
├── Owner      — play at the character's current position
└── Weapon     — play at the weapon's muzzle socket
```

This allows a single animation to work with different weapon types — the effect always appears at the right position.

## 4. Effect Notify System

Effect notifies manage **visual effects** (VFX) tied to animations:

### Instant Effect Notify

Triggers a particle effect, sound, or material change at a single frame:

```
Trigger:
├── Resolve the skin component (which visual variant to use)
├── Look up the effect by gameplay tag
├── Play the effect on the target mesh
└── Support "instigator" effects (effects from the attacker)
```

### State Effect Notify

Manages effects that *persist* (持续) across multiple frames:

```
Begin:  Start the effect (e.g., glowing weapon trail)
Tick:   Check visibility — stop effect if mesh becomes hidden
End:    Stop the effect, optionally trigger an "end" effect
        (e.g., trail fades out with a dissolve particle)
```

### Skin System Integration

Effects are resolved through the **skin system** — different character or weapon skins may have different VFX:

```
Effect Resolution:
├── Get the current skin ID
├── Look up the skin-specific effect config
├── If found → use skin-specific effect
├── If not found → fall back to default skin effect
└── Special case: wall mode may hide certain effects
```

## 5. Weapon Animation State Machine

Weapons have their own **animation instance** that tracks the weapon's current state:

### State Flags

```
Weapon Animation State:
├── bEquipped          — weapon is currently held
├── bEquipping         — draw animation is playing
├── bAttacking         — fire/swing animation is playing
├── bEjectingMagazine  — magazine removal animation
├── bInsertingMagazine — magazine insertion animation
├── bOperatingBolt     — bolt cycling animation
├── bPullingBolt       — bolt pull animation
├── bRelax             — relaxed idle pose
├── bReady             — ready/alert pose
├── bAiming            — shoulder aim pose
└── bADS               — scope/ADS pose
```

### Update Flow

Every frame, the weapon animation instance:

1. Reads the weapon's FSM state (equip, reload, attack, etc.)
2. Updates the hold type (relaxed, ready, aiming, ADS)
3. Reads the attack switcher state (single, burst, auto)
4. Sets the animation blueprint variables accordingly

The animation blueprint uses these flags to *blend* (混合) between poses and play the correct montages.

## 6. Character Locomotion System

Character animation uses an advanced **locomotion system** that blends multiple data sources:

### Core Data Streams

```
Locomotion Data:
├── Location Data
│   ├── World position
│   └── Displacement speed (how fast the character moves)
│
├── Rotation Data
│   ├── World rotation
│   ├── Yaw delta speed (turning rate)
│   └── Lean angle (body tilt when turning)
│
├── Velocity Data
│   ├── Local velocity (forward, right, up components)
│   ├── Velocity blend (multi-directional blending weights)
│   └── Sprint alpha (0.0 = walk, 1.0 = sprint)
│
└── Acceleration Data
    ├── Direction change detection
    └── Stop detection
```

### Key Animation Behaviors

| Behavior | Input | Output |
| --- | --- | --- |
| **Directional Movement** | Local velocity vector | Blend between forward, backward, left, right animations |
| **Speed Blending** | Displacement speed | Blend between walk, run, sprint |
| **Turn in Place** | Yaw delta exceeds threshold (50°) | Play turn-left or turn-right animation |
| **Lean** | Turning speed | Tilt the body *laterally* (横向地) |
| **Stop Animation** | Velocity drops to zero | Play deceleration animation based on previous direction |
| **Root Yaw Offset** | Camera rotation vs. body rotation | *Compensate* (补偿) so feet don't slide |
| **Aim Offset** | Look direction vs. body direction | Upper body rotates toward aim target |

### Configuration Parameters

```
Tuning Values:
├── Cardinal Direction Dead Zone:  10°  (prevents jittering between directions)
├── Walk Speed:                    300 cm/s
├── Run Speed:                     600 cm/s
├── Sprint Speed:                  900 cm/s
├── Lean Amount:                   0.001875 (body tilt weight)
├── Rotate Threshold:              50°  (when to trigger turn-in-place)
└── Direction Change Threshold:    0.6s (delay before changing blend direction)
```

> 句型解析: "Root yaw offset compensates so feet don't slide" — 根骨骼偏移补偿确保角色转身时脚不会在地面滑动，这是高质量动画的关键技术。

## 7. Prop Attachment System

Some animations require **temporary props** — objects that appear and disappear during specific animation segments:

### How It Works

```
AnimNotifyState_AttachItem:

Begin:
├── Create or retrieve the prop actor
├── Attach to the specified bone socket (e.g., "hand_r")
├── Set visibility based on the character's current state
└── Apply the correct skin variant

End:
└── Destroy or pool the prop actor
```

### Use Cases

| Prop | Socket | Animation | Duration |
| --- | --- | --- | --- |
| Magazine | hand_l | Reload animation | Only during mag swap |
| Grenade | hand_r | Throw animation | Only during wind-up |
| Knife | hand_r | Melee inspection | Only during inspect |
| Item | hand_r | Interaction animation | Only while interacting |

## 8. Camera Height Adjustment

During certain animations, the **camera height** needs to change dynamically:

```
Eye Height Control:
├── Stand-up animation:  Camera at standing eye height
├── Crouch animation:    Camera lowers to crouch height
├── Prone animation:     Camera drops to ground level
└── Custom animations:   Camera follows a bone position
```

The system uses a **counter pattern** — entering an animation increments a "disable landing transition" counter, and exiting decrements it. This prevents conflicts when multiple animations overlap.

## 9. Network Synchronization

### Client-Only Execution

Most animation notifies only execute on clients — the dedicated server does not need to render effects:

```
Execution Check:
if (NetworkMode == DedicatedServer)
    return;  // skip all visual notifies on server
```

### Attack Synchronization

Attack timing follows a specific flow:

```
1. Client plays attack animation
2. AnimNotify fires → client performs local hit detection
3. Client sends hit result to server (RPC)
4. Server validates the hit
5. Server broadcasts visual feedback to all clients (Multicast)
6. All clients play impact effects
```

This approach gives the local player *instant feedback* (即时反馈) while maintaining server authority.

## 10. Performance Optimization

Animation is one of the most CPU-intensive systems. Key optimization techniques include:

### Curve Value Caching

Animation curves (smooth value changes over time) are cached to avoid *redundant* (冗余的) lookups:

```
First lookup:  Calculate curve value → store in cache
Later lookups: Return cached value directly
```

### Conditional Execution

Effects are skipped when they would not be visible:

```
Skip Conditions:
├── Character is not the view target (too far away)
├── Quality setting is set to Low
├── Mesh component is currently hidden
└── Console variable disables the effect type
```

### Visibility Checks

State notifies continuously check if their target mesh is still visible. If the mesh becomes hidden (e.g., the character moves off-screen), the effect is stopped immediately to save GPU resources.

## 11. Key Takeaways

- Animation uses an **event-driven** architecture with instant and state notifies embedded in timelines
- **Attack notifies** precisely *synchronize* (同步) hit detection with visual impact
- **Effect notifies** resolve through the skin system for variant-specific VFX
- Weapons have their own **animation state machine** with flags for equip, fire, reload, and aim states
- The **locomotion system** blends direction, speed, lean, turn-in-place, and aim offset for natural movement
- **Prop attachment** creates temporary objects during specific animation segments
- Most notifies are **client-only** — the server skips visual processing
- **Performance optimization** uses caching, conditional execution, and visibility checks to minimize CPU/GPU cost
