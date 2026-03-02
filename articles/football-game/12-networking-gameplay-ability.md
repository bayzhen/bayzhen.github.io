---
layout: article
title: "Networking & Gameplay Ability Systems"
description: "Network architecture for online football games and gameplay ability system design — replication, prediction, GAS patterns, and ability lifecycle"
lang: en
level: advanced
tags: ["Networking", "GAS", "Multiplayer", "Technical"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 12
prev:
  title: "Football & Football Game Glossary"
  url: "11-glossary.html"
---

## 1. Introduction

Building an online football game is one of the most *demanding* (高要求的) challenges in multiplayer game engineering. The game must feel responsive at 60fps while synchronizing 22 players, a ball, and dozens of game events across a network with *variable latency* (可变延迟).

This article covers two tightly related systems: the **network architecture** that keeps all clients in sync, and the **Gameplay Ability System (GAS)** that structures player actions in a replication-friendly way.

## 2. Network Architecture Models

### 2.1 Client-Server vs. Peer-to-Peer

| Model | Description | Use Case |
| --- | --- | --- |
| **Dedicated Server** | A central *authoritative* (权威的) server runs the simulation; clients send input and receive state | Competitive online matches |
| **Listen Server** | One player's machine acts as both client and server | Casual / LAN play |
| **Peer-to-Peer (P2P)** | All clients communicate directly; no central authority | Legacy games, co-op modes |
| **Relay Server** | Clients connect through a relay but use P2P logic | NAT traversal (NAT穿透) assistance |

Most modern football games use a **dedicated server model** for competitive modes. The server is the *single source of truth* (唯一真实来源) — it validates all actions and *resolves conflicts* (解决冲突).

> 句型解析: "The server is the single source of truth" — "single source of truth" 是软件工程术语，指所有客户端都以服务器的状态为准，客户端的状态仅作为预测参考。

### 2.2 Lockstep vs. State Synchronization

Two fundamental approaches to keeping clients in sync:

**Lockstep** (帧同步):
- All clients simulate the game *deterministically* (确定性地) from the same inputs
- Only **inputs** are sent over the network — no game state
- Every client must produce *identical* (完全相同的) results for the same inputs
- Used in: older RTS games, some mobile football games

```
Frame N:
  1. Collect local input
  2. Wait for all remote inputs for frame N
  3. Simulate frame N with all inputs
  4. Render frame N

Requirement: deterministic simulation
  - Fixed-point math (no floating-point drift)
  - Identical random seeds
  - Same update order on all clients
```

**State Synchronization** (状态同步):
- The server runs the *authoritative* (权威的) simulation
- Server sends **game state snapshots** to clients
- Clients *interpolate* (插值) between received states for smooth visuals
- Used in: EA FC, eFootball, most console/PC football games

```
Server (60 Hz):
  1. Receive client inputs
  2. Simulate game state
  3. Send state snapshot to all clients (20-60 Hz)

Client:
  1. Send local input to server
  2. Predict local player movement immediately
  3. Receive server snapshot
  4. Reconcile prediction with server state
  5. Interpolate remote entities between snapshots
```

> 句型解析: "Clients interpolate between received states for smooth visuals" — "interpolate between" 意为"在...之间进行插值"，客户端在两个快照之间进行平滑过渡以避免画面卡顿。

### 2.3 Choosing the Right Model for Football

| Factor | Lockstep | State Sync |
| --- | --- | --- |
| Bandwidth | Very low (inputs only) | Higher (state data) |
| Latency tolerance | Low — must wait for all inputs | Higher — prediction hides latency |
| Determinism required | Yes — strict requirement | No |
| Cheat resistance | Moderate (input validation) | High (server authority) |
| Reconnection | Difficult (must replay all frames) | Easy (send latest snapshot) |
| Complexity | Simpler protocol, harder simulation | More complex protocol, flexible simulation |

State synchronization with **client-side prediction** is the standard for football games because it handles variable latency gracefully and doesn't require deterministic physics.

## 3. Client-Side Prediction and Reconciliation

### 3.1 The Latency Problem

Without prediction, a player presses "pass" and waits 50–100ms for the server to respond. In a 60fps game, that's 3–6 frames of *input lag* (输入延迟) — completely *unacceptable* (不可接受的) for gameplay.

### 3.2 Prediction

The client *predicts* (预测) the result of its own input immediately, without waiting for the server:

```
function onLocalInput(input) {
    // Apply input locally RIGHT NOW
    predicted_state = simulateInput(local_player, input)
    renderPlayer(predicted_state)
    
    // Also send input to server
    sendToServer({ input: input, frame: current_frame })
    
    // Store prediction for later reconciliation
    prediction_history.push({ frame: current_frame, state: predicted_state, input: input })
}
```

The local player moves instantly — no perceived lag.

### 3.3 Server Reconciliation

When the server response arrives, the client must *reconcile* (协调) its prediction with the server's authoritative state:

```
function onServerSnapshot(snapshot) {
    // Find the prediction that matches this server frame
    server_frame = snapshot.frame
    
    // Discard all predictions older than the server frame
    prediction_history.removeOlderThan(server_frame)
    
    // Compare server state with our prediction for that frame
    our_prediction = prediction_history.getForFrame(server_frame)
    
    if difference(our_prediction.state, snapshot.state) > threshold:
        // Prediction was WRONG — correct it
        corrected_state = snapshot.state
        
        // Re-simulate all inputs from server_frame to now
        for prediction in prediction_history.after(server_frame):
            corrected_state = simulateInput(corrected_state, prediction.input)
        
        // Smoothly blend to corrected position (avoid visual snap)
        local_player.position = lerp(local_player.position, corrected_state.position, correction_speed)
```

> 句型解析: "When the server response arrives, the client must reconcile its prediction with the server's authoritative state" — "reconcile A with B" 意为"将A与B协调一致"。客户端需要将自己的预测结果与服务器的权威状态进行对比和修正。

### 3.4 What to Predict in Football

| Action | Predict Locally? | Why |
| --- | --- | --- |
| Local player movement | Yes | Must feel instant |
| Local player dribbling | Yes | Ball at feet must track player |
| Pass initiation | Yes (animation) | Player should start pass animation immediately |
| Ball trajectory after pass | Partial | Show initial direction, server corrects destination |
| Opponent movement | No — use interpolation | We don't have their input |
| Tackle outcome | No — server decides | Critical gameplay outcome must be authoritative |
| Goal scoring | No — server decides | Must be 100% authoritative |

## 4. Entity Interpolation

For entities you don't control (opponents, AI teammates, the ball when not at your feet), the client uses **interpolation** (插值) to display smooth movement:

```
function interpolateEntity(entity, current_time) {
    // We always render slightly in the PAST
    render_time = current_time - interpolation_delay  // typically 100ms
    
    // Find the two server snapshots that bracket render_time
    snapshot_before = findSnapshotBefore(render_time)
    snapshot_after = findSnapshotAfter(render_time)
    
    // Interpolation factor (0.0 to 1.0)
    t = (render_time - snapshot_before.time) / (snapshot_after.time - snapshot_before.time)
    
    // Smoothly blend between the two known positions
    entity.render_position = lerp(snapshot_before.position, snapshot_after.position, t)
    entity.render_rotation = slerp(snapshot_before.rotation, snapshot_after.rotation, t)
}
```

This means remote players are always rendered ~100ms in the past. The *trade-off* (权衡) is: slightly outdated positions in exchange for perfectly smooth movement.

**Extrapolation** (外推) — predicting *forward* from the last known state — is riskier and can cause visible *rubber-banding* (橡皮筋效应) when the prediction is wrong.

## 5. Football-Specific Network Challenges

### 5.1 Ball Ownership Transitions

When a player passes the ball, **ownership** (持球权) transfers from one entity to another. This is a *critical state transition* (关键状态转换) that must be handled carefully:

```
// Server-side pass execution
function executePass(passer, target, pass_type) {
    // 1. Remove ball ownership from passer
    ball.owner = null
    ball.state = BallState.InFlight
    
    // 2. Calculate trajectory
    trajectory = calculatePassTrajectory(passer, target, pass_type)
    ball.setTrajectory(trajectory)
    
    // 3. Mark target as potential receiver
    ball.intended_receiver = target
    
    // 4. Broadcast to all clients with HIGH PRIORITY
    replicateEvent(PassEvent {
        passer_id: passer.id,
        target_id: target.id,
        ball_trajectory: trajectory,
        timestamp: server_time
    }, priority: HIGH)
}
```

Ball ownership changes need **high-priority replication** — if a client misses or delays this event, the ball appears to teleport or stick to the wrong player.

### 5.2 Tackle Arbitration

When two players from different clients contest the ball *simultaneously* (同时地), the server must *arbitrate* (仲裁):

```
function arbitrateTackle(defender, attacker, ball) {
    // Both clients think they won the ball — server decides
    tackle_success = calculateTackleOutcome(defender, attacker)
    
    if tackle_success:
        ball.owner = defender
        replicateEvent(TackleWon { winner: defender.id })
        // Losing client must correct: their player loses the ball
    else:
        replicateEvent(TackleFailed { defender: defender.id })
        // Defending client must correct: their tackle didn't work
}
```

This is where *mispredictions* (错误预测) are most visible. Good games use **animation blending** (动画混合) to mask the correction — the losing player smoothly transitions into a stumble or recovery animation.

### 5.3 Goal Validation

Goals must be **server-authoritative** (服务器权威的) with no exceptions:

```
function validateGoal(ball, goal) {
    if ball has fully crossed goal line:
        // Server confirms the goal
        broadcast(GoalScored { ... })
        
        // All clients MUST accept this, even if their local
        // simulation showed the ball missing
        
        // Trigger replay from multiple angles
        triggerReplayCapture(last_5_seconds)
}
```

### 5.4 Bandwidth Optimization

Sending full state for 22 players at 60Hz would consume too much *bandwidth* (带宽). Common optimizations:

| Technique | Description |
| --- | --- |
| **Delta compression** (增量压缩) | Only send what changed since last snapshot |
| **Quantization** (量化) | Reduce precision: position to 0.01m, angle to 1 degree |
| **Relevance filtering** (相关性过滤) | Send distant players less frequently |
| **Variable tick rate** | Critical events at 60Hz, background state at 20Hz |
| **Bit packing** | Pack multiple small values into single bytes |

```
// Delta compression example
function createDelta(current_state, previous_state) {
    delta = {}
    for each entity in current_state:
        if entity.position != previous_state[entity.id].position:
            delta[entity.id].position = quantize(entity.position, 0.01)
        if entity.velocity != previous_state[entity.id].velocity:
            delta[entity.id].velocity = quantize(entity.velocity, 0.1)
    return compress(delta)
}
```

## 6. Gameplay Ability System (GAS) Overview

The **Gameplay Ability System** is an architecture pattern (popularized by Unreal Engine's GAS) that structures all player actions as discrete, *self-contained* (自包含的) ability objects. It fits football games exceptionally well because every action — passing, shooting, tackling, dribbling — can be modeled as an ability.

### 6.1 Core Concepts

| Concept | Description | Football Example |
| --- | --- | --- |
| **Ability** | A discrete action a player can perform | Pass, Shoot, Tackle, Sprint, Skill Move |
| **Attribute Set** | Numerical stats attached to a player | Pace, Shooting, Passing, Defending |
| **Gameplay Effect (GE)** | A modification to attributes, temporary or permanent | Stamina drain, injury debuff, morale boost |
| **Gameplay Tag** | A *hierarchical* (层级的) label for categorizing states | `State.HasBall`, `Action.Shooting`, `Status.Injured` |
| **Ability Task** | An async sub-action within an ability | Play animation, wait for event, apply effect |

### 6.2 Why GAS for Football

- **Replication-friendly**: Abilities are designed to work with client-server networking
- **Composable**: Complex moves combine simple building blocks
- **Data-driven**: Designers can create new abilities without code changes
- **Predictable**: Abilities support client prediction and server correction natively

> 句型解析: "Abilities are designed to work with client-server networking" — 被动语态，"be designed to" 意为"被设计为...的"。GAS中的能力天然支持客户端-服务器架构下的网络复制。

## 7. Ability Lifecycle

Every football ability follows a lifecycle:

```
┌──────────────┐
│  CanActivate  │ ← Check: has ball? enough stamina? not already in action?
└──────┬───────┘
       │ yes
┌──────▼───────┐
│  PreActivate  │ ← Commit cost (stamina), apply tags
└──────┬───────┘
       │
┌──────▼───────┐
│   Activate    │ ← Start animation, begin ability logic
└──────┬───────┘
       │
┌──────▼───────┐
│   Execute     │ ← Core logic: calculate trajectory, apply force, etc.
└──────┬───────┘
       │
┌──────▼───────┐
│    End        │ ← Clean up, remove tags, trigger cooldown
└──────────────┘
```

### Example: Shoot Ability

```
class ShootAbility extends GameplayAbility {
    
    function canActivate(player) {
        return player.hasBall
            and not player.hasTag("Status.Injured")
            and not player.hasTag("Action.InProgress")
            and player.stamina > min_stamina_to_shoot
    }
    
    function preActivate(player) {
        player.addTag("Action.Shooting")
        player.addTag("Action.InProgress")
        applyEffect(player, StaminaDrainEffect, magnitude: 5)
    }
    
    function activate(player, input) {
        // Start charge-up animation
        task_anim = playAnimation(player, "shoot_windup")
        
        // Track charge time for power
        charge_start = current_time
        
        // Wait for button release or max charge
        await waitForEvent(ShootButtonReleased, timeout: max_charge_time)
        
        charge_duration = current_time - charge_start
        execute(player, input.aim_direction, charge_duration)
    }
    
    function execute(player, aim_direction, charge_time) {
        // Calculate shot parameters from attributes and input
        power = calculateShotPower(player.shot_power, charge_time)
        accuracy = calculateAccuracy(player.finishing, player.composure, 
                                      countNearbyDefenders(player))
        spin = calculateSpin(player.curve, input.spin_modifier)
        
        // Apply deviation based on accuracy
        final_direction = applyDeviation(aim_direction, accuracy)
        
        // Create ball impulse
        impulse = createBallImpulse(final_direction, power, spin)
        
        // SERVER: apply impulse to ball (authoritative)
        if isServer():
            ball.applyImpulse(impulse)
            ball.owner = null
            replicateEvent(ShotFired { player.id, impulse })
        
        // CLIENT: predict ball movement
        if isLocallyControlled():
            ball.predictImpulse(impulse)
        
        playAnimation(player, "shoot_strike")
        playSound("shot_power_" + getPowerLevel(power))
    }
    
    function end(player) {
        player.removeTag("Action.Shooting")
        player.removeTag("Action.InProgress")
        applyCooldown(player, shoot_cooldown)
    }
}
```

## 8. Gameplay Effects in Football

**Gameplay Effects** (游戏效果) modify player attributes temporarily or permanently:

### 8.1 Effect Types

| Type | Duration | Football Example |
| --- | --- | --- |
| **Instant** | Immediate, one-time | Stamina cost of a sprint |
| **Duration** | Lasts for set time | Speed boost after a skill move |
| **Infinite** | Lasts until removed | Injury *debuff* (减益效果) |
| **Periodic** | Repeats at intervals | Stamina *regeneration* (恢复) while walking |

### 8.2 Effect Stacking

What happens when multiple effects target the same attribute?

```
Stacking Policies:
  - AGGREGATE:  Effects stack additively (stamina drains accumulate)
  - OVERRIDE:   Strongest effect wins (speed boosts don't stack)
  - REFRESH:    Restart the duration but don't increase magnitude
  - DENY:       New effect is rejected if one already exists

Example:
  Player has SpeedBoost (+10%) from skill move
  Player activates Sprint (+20% speed)
  
  With OVERRIDE policy: only +20% applies
  With AGGREGATE policy: +30% total
```

### 8.3 Common Football Gameplay Effects

```yaml
effects:
  - name: SprintStaminaDrain
    type: periodic
    interval: 0.1s
    attribute: stamina
    modifier: -2.0
    tags_required: ["Action.Sprinting"]
    
  - name: InjuryDebuff
    type: infinite
    modifiers:
      pace: -15%
      acceleration: -20%
      agility: -10%
    removal_condition: substituted or healed
    
  - name: MoraleBoost
    type: duration
    duration: 300s  # 5 minutes game time
    trigger: goal_scored_by_team
    modifiers:
      composure: +10%
      work_rate: +5%
    
  - name: FatigueLateMmatch
    type: duration
    activation: minute > 75
    modifiers:
      pace: -(90 - stamina_percent)%
      passing: -(50 - stamina_percent * 0.5)%
```

## 9. Gameplay Tags for State Management

**Gameplay Tags** (游戏标签) provide a flexible, *hierarchical* (层级化的) way to query player state:

```
Tag Hierarchy:
  State
  ├── State.HasBall
  ├── State.OnGround
  ├── State.InAir
  └── State.Offside
  
  Action
  ├── Action.InProgress
  ├── Action.Passing
  ├── Action.Shooting
  ├── Action.Tackling
  ├── Action.Dribbling
  ├── Action.Heading
  └── Action.SkillMove
      ├── Action.SkillMove.StepOver
      ├── Action.SkillMove.Roulette
      └── Action.SkillMove.Elastico
  
  Status
  ├── Status.Injured
  ├── Status.Fatigued
  ├── Status.YellowCarded
  ├── Status.Cooldown
  │   ├── Status.Cooldown.Tackle
  │   └── Status.Cooldown.Sprint
  └── Status.Immune
      └── Status.Immune.SkillMoveProtection
```

Tags are used for:
- **Ability gating**: "Can only shoot if has `State.HasBall` and not `Action.InProgress`"
- **Effect conditions**: "Apply fatigue only if `Action.Sprinting` is active"
- **AI queries**: "Is this player `Status.Fatigued`? Choose a different pass target"
- **Animation selection**: "If `Action.SkillMove.Roulette`, play roulette animation"
- **Network filtering**: "Only replicate `Action.*` tags, not internal state tags"

## 10. GAS and Network Replication

The Gameplay Ability System is designed for networked games. Here's how abilities *replicate* (复制/同步) across the network:

### 10.1 Replication Flow

```
Client (Prediction)              Server (Authority)
─────────────────                ──────────────────
Player presses Shoot
       │
       ▼
CanActivate? → Yes
       │
       ▼
Predict locally:                 Receive input
  - Play animation               CanActivate? → Yes
  - Predict ball trajectory            │
  - Apply local tags                   ▼
       │                         Execute authoritatively:
       │                           - Calculate real trajectory
       │                           - Apply effects
       │                           - Update ball state
       │                                │
       │                                ▼
       │                         Replicate to all clients:
       │                           - Confirmed ball state
       │◄───────────────────────── - Applied effects
       │                           - Updated tags
       ▼
Reconcile:
  - Correct ball if different
  - Confirm or rollback effects
  - Blend animations smoothly
```

### 10.2 What Gets Replicated

| Data | Replication | Priority |
| --- | --- | --- |
| Ability activation | Server → All Clients | High |
| Gameplay Effects | Server → Owning Client | Medium |
| Active Gameplay Tags | Server → All Clients | Medium |
| Attribute changes | Server → Owning Client | Medium |
| Animation montages | Multicast (server → all) | High |
| Cooldown state | Server → Owning Client | Low |

## 11. Practical Example: Complete Tackle Flow

Bringing networking and GAS together in a complete tackle scenario:

```
Timeline:

T=0ms   [Client A] Defender presses Tackle button
T=0ms   [Client A] Local prediction: play tackle animation,
                    add tag Action.Tackling
T=0ms   [Client A] Send TackleInput to server

T=30ms  [Server]   Receives TackleInput from Client A
T=30ms  [Server]   CanActivate(TackleAbility)? → Yes
T=30ms  [Server]   Execute tackle: check distance, timing, attributes
T=31ms  [Server]   Result: TACKLE_SUCCESS
T=31ms  [Server]   Ball.owner = defender
T=31ms  [Server]   Apply StaminaDrain effect to defender
T=31ms  [Server]   Apply FoulCheck: clean tackle, no foul
T=31ms  [Server]   Replicate: TackleResult, BallOwnership, Effects

T=60ms  [Client A] Receives confirmation — prediction was correct!
                    Continue tackle animation normally
T=60ms  [Client B] Receives TackleResult — attacker lost ball
                    Play stumble animation, remove ball from attacker
                    Correct ball position to match server state

T=80ms  [All]      Game continues with new ball ownership
```

## 12. Key Takeaways

- **State synchronization** with client-side prediction is the standard for online football — lockstep is simpler but less tolerant of latency
- **Client-side prediction** makes the local player feel responsive; **server reconciliation** corrects any *mispredictions* (错误预测)
- **Entity interpolation** keeps remote players smooth by rendering them slightly in the past
- Ball ownership transitions, tackle *arbitration* (仲裁), and goal validation must be **server-authoritative**
- The **Gameplay Ability System** models every football action as a discrete ability with a clear lifecycle: CanActivate → PreActivate → Activate → Execute → End
- **Gameplay Effects** handle attribute modifications (stamina drain, injury debuffs, morale boosts) with stacking policies
- **Gameplay Tags** provide hierarchical state queries used by abilities, effects, AI, and network replication
- GAS is *inherently* (天然地) replication-friendly — abilities predict locally and reconcile with server authority
