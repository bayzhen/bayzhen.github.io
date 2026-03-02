---
layout: article
title: "Football Game AI Design"
description: "AI systems in football games — team intelligence, player decision-making, difficulty scaling, and common architectures"
lang: en
level: intermediate
tags: ["AI", "Game Design", "Decision Making"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 7
prev:
  title: "Match Mechanics & Gameplay Systems"
  url: "06-match-mechanics.html"
next:
  title: "Football Game Architecture Patterns"
  url: "08-architecture-patterns.html"
---

## 1. Why Football AI is Hard

Football AI is one of the most *demanding* (高要求的) challenges in game AI. Unlike turn-based games, football requires:

- **22 agents** making decisions *simultaneously* (同时地)
- **Real-time** responses at 30–60 decisions per second
- **Coordination** between 11 teammates without explicit communication
- **Emergent behavior** that looks and feels like real football
- **Scalable difficulty** from beginner to expert-level play

The AI must handle *both* teams — the opponent AI and the teammate AI (players on your team not currently controlled by the human).

## 2. AI Architecture Layers

Football game AI is typically organized into three hierarchical layers:

```
┌─────────────────────────────────────────────────────┐
│              Strategic Layer (战略层)                 │
│  Team-wide decisions: formation, pressing, mentality │
│  Update rate: every few seconds or on events         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Tactical Layer (战术层)                  │
│  Group decisions: passing lanes, runs, defensive     │
│  shape, set piece routines                           │
│  Update rate: every 0.5-1 second                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Individual Layer (个体层)                │
│  Per-player decisions: move, pass, shoot, tackle     │
│  Update rate: every frame (16-33ms)                  │
└─────────────────────────────────────────────────────┘
```

> 句型解析: "Football game AI is typically organized into three hierarchical layers" — "hierarchical" (层级的) 意为从上到下有从属关系的结构，战略层指导战术层，战术层指导个体层。

## 3. Strategic AI — The Team Brain

The strategic layer makes high-level decisions that affect the entire team:

### Game State Assessment

```
function assessGameState(match) {
    score_diff = my_goals - opponent_goals
    time_remaining = 90 - current_minute
    possession_ratio = my_possession / total_time
    
    if score_diff > 0 and time_remaining < 15:
        return "protect_lead"
    if score_diff < 0 and time_remaining < 20:
        return "all_out_attack"
    if possession_ratio > 0.6:
        return "control_game"
    return "balanced"
}
```

### Dynamic Formation Shifts

Based on the game state, the AI can *dynamically* (动态地) adjust the formation:

| Game State | Formation Shift | Pressing |
| --- | --- | --- |
| Protect lead | Shift to 5-4-1 | Low block |
| All-out attack | Shift to 3-4-3 | High press |
| Control game | Maintain current | Mid block |
| Chasing the game | Push full-backs forward | High press |

## 4. Tactical AI — Group Coordination

The tactical layer coordinates groups of players to create *patterns of play* (比赛模式):

### Passing Network Analysis

The AI evaluates available passing options by scoring each potential receiver:

```
function evaluatePassTarget(passer, receiver, opponents) {
    lane_openness = calculateLaneOpenness(passer, receiver, opponents)
    field_position_value = getPositionValue(receiver.position)
    receiver_freedom = getPlayerFreedom(receiver, opponents)
    forward_progress = receiver.y - passer.y
    
    score = w1 * lane_openness
          + w2 * field_position_value
          + w3 * receiver_freedom
          + w4 * max(0, forward_progress)
    
    return score
}
```

### Off-Ball Movement

Perhaps the most critical AI system — how do players *without* the ball decide where to run?

**Movement types:**

- **Support run** (接应跑位): Move toward the ball carrier to offer a safe pass
- **Overlap run** (套边跑位): Full-back runs outside the winger
- **Diagonal run** (斜线跑位): Cut *diagonally* (对角线地) behind defenders
- **Decoy run** (牵制跑位): Run to drag a defender away, creating space for others
- **Check run** (回撤接应): Move toward the ball to receive under pressure

Each player evaluates potential runs using an *influence map* (影响力图) — a grid overlay on the pitch that shows value and danger zones.

> 句型解析: "Each player evaluates potential runs using an influence map" — "influence map" 是游戏AI中的常用术语，指将球场划分为网格，每个格子标注战术价值和危险程度。

### Defensive Shape

When the team loses the ball, the tactical AI must *reorganize* (重新组织) the defensive shape:

1. **Transition trigger**: Ball is lost — all players switch to defensive AI
2. **Recovery runs**: Players sprint back toward their defensive positions
3. **Compactness**: The team *compresses* (压缩) horizontally and vertically to deny space
4. **Marking assignments**: Each defender is assigned a player or zone to cover

## 5. Individual AI — Per-Player Decisions

At the individual level, each AI player makes frame-by-frame decisions. Common approaches include:

### 5.1 Behavior Trees

**Behavior trees** (行为树) are the most common architecture for individual football AI:

```
Root (Selector)
├── HasBall? (Sequence)
│   ├── UnderPressure? ──▶ PassToSafestTarget
│   ├── InShootingRange? ──▶ EvaluateShot
│   ├── CanDribbleForward? ──▶ Dribble
│   └── Default ──▶ LookForPass
│
├── TeamHasBall? (Sequence)
│   ├── InGoodPosition? ──▶ HoldPosition
│   ├── SpaceAvailable? ──▶ MakeRun
│   └── Default ──▶ SupportBallCarrier
│
└── OpponentHasBall? (Sequence)
    ├── NearestToBall? ──▶ PressOpponent
    ├── InDefensiveZone? ──▶ MarkAssignment
    └── Default ──▶ RecoverPosition
```

### 5.2 Utility AI

**Utility AI** (效用AI) scores multiple potential actions and picks the highest:

```
function decideAction(player, context) {
    actions = {
        "pass":    scorePassing(player, context),
        "shoot":   scoreShooting(player, context),
        "dribble": scoreDribbling(player, context),
        "hold":    scoreHolding(player, context)
    }
    return argmax(actions)
}

function scoreShooting(player, context) {
    distance = distanceTo(goal)
    angle = angleToGoal(player)
    defenders = countBlockingDefenders(player, goal)
    
    base = player.finishing / 100
    distance_factor = 1.0 - (distance / max_shot_range)
    angle_factor = angle / 45.0
    clear_factor = 1.0 / (1 + defenders)
    
    return base * distance_factor * angle_factor * clear_factor
}
```

### 5.3 State Machines

Simpler games use **finite state machines** (有限状态机, FSM) for individual AI:

```
States: Idle, ChaseBall, Dribble, Pass, Shoot, Defend, ReturnToPosition

Transitions:
  Idle → ChaseBall:         ball is loose and nearby
  ChaseBall → Dribble:     won the ball
  Dribble → Pass:          teammate is open and better positioned
  Dribble → Shoot:         within shooting range and angle
  Dribble → Defend:        lost the ball
  Any → ReturnToPosition:  ball is far away
```

## 6. Difficulty Scaling

AI difficulty is a critical design challenge — the game must be fun for both beginners and experts.

### Approaches to Difficulty

| Method | Description | Pros | Cons |
| --- | --- | --- | --- |
| Attribute scaling | Boost/reduce AI player stats | Simple to implement | Feels unfair — "*rubber banding*" (橡皮筋效应) |
| Decision quality | AI makes better/worse choices | More natural feeling | Complex to tune |
| Reaction time | AI responds faster/slower | Subtle and effective | Can feel robotic at extremes |
| Error injection | AI *deliberately* (故意地) makes mistakes | Very natural | Hard to calibrate |
| Tactical depth | AI uses more/fewer tactical concepts | Most realistic | Requires extensive AI systems |

> 句型解析: "rubber banding" (橡皮筋效应) 指的是当领先时AI被增强、当落后时AI被削弱的动态难度调整，名称来源于被拉伸的橡皮筋会弹回的物理现象。

The best approach combines multiple methods — lower difficulties reduce decision quality and inject errors, while higher difficulties unlock advanced tactical patterns.

## 7. Teammate AI

Teammate AI (控制队友的AI) has unique challenges compared to opponent AI:

- Must not *outperform* (表现优于) the human player — the human should feel like the star
- Must be *responsive* (响应灵敏的) to the human's play style
- Must not make obviously stupid mistakes (players blame their AI teammates more than opponents)
- Should *complement* (补充) the human's actions — e.g., making runs when the human has the ball

## 8. Key Takeaways

- Football AI uses a **three-layer hierarchy**: strategic (team), tactical (group), individual (player)
- **Off-ball movement** is the hardest and most impactful AI system
- Common individual AI architectures: **behavior trees**, **utility AI**, and **state machines**
- Difficulty scaling should combine **decision quality**, **reaction time**, and **error injection** — not just stat boosts
- Teammate AI has the unique constraint of being helpful without *overshadowing* (抢风头) the human player
