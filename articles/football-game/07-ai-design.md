---
layout: article
title: "Football Game AI Design"
description: "How 22 AI players coordinate in real-time without looking stupid — the hardest problem in sports game development"
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

## The Challenge

Football AI is one of the hardest problems in game development. Here's why:

- **22 agents** making decisions simultaneously
- **Real-time** responses at 30-60 decisions per second
- **Coordination** between 11 teammates without explicit communication
- **Emergent behavior** that looks like real football
- **Scalable difficulty** from beginner to expert

And the kicker: the AI must control both your opponents *and* your teammates (the 10 players you're not directly controlling). If your AI teammates do something stupid, players blame you, not the AI.

## The Three-Layer Architecture

Football AI is organized into three hierarchical layers:

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

Each layer informs the layer below. Strategy sets the overall plan, tactics coordinate groups, individuals execute.

## Strategic AI — The Team Brain

The strategic layer makes high-level decisions that affect the entire team.

### Game State Assessment

```python
def assess_game_state(match):
    score_diff = my_goals - opponent_goals
    time_remaining = 90 - current_minute
    possession_ratio = my_possession / total_time

    if score_diff > 0 and time_remaining < 15:
        return "protect_lead"
    elif score_diff < 0 and time_remaining < 20:
        return "all_out_attack"
    elif possession_ratio > 0.6:
        return "control_game"
    else:
        return "balanced"
```

### Dynamic Formation Shifts

Based on game state, the AI adjusts formation:

| Game State | Formation Shift | Pressing |
|------------|-----------------|----------|
| Protect lead | 5-4-1 (defensive) | Low block |
| All-out attack | 3-4-3 (offensive) | High press |
| Control game | Maintain current | Mid block |
| Chasing game | Push full-backs forward | High press |

**Real example**: You're winning 1-0 in the 80th minute. The AI shifts to a defensive formation, pulls attackers back, and wastes time with slow passes. Frustrating to play against, but realistic.

## Tactical AI — Group Coordination

The tactical layer coordinates groups of players to create patterns of play.

### Passing Network Analysis

The AI evaluates available passing options by scoring each potential receiver:

```python
def evaluate_pass_target(passer, receiver, opponents):
    # Is the passing lane clear?
    lane_openness = calculate_lane_openness(passer, receiver, opponents)

    # Is the receiver in a valuable position?
    field_position_value = get_position_value(receiver.position)

    # Is the receiver under pressure?
    receiver_freedom = get_player_freedom(receiver, opponents)

    # Does this pass move the ball forward?
    forward_progress = receiver.y - passer.y

    # Weighted score
    score = (w1 * lane_openness +
             w2 * field_position_value +
             w3 * receiver_freedom +
             w4 * max(0, forward_progress))

    return score
```

The AI picks the highest-scoring target. High-difficulty AI uses better weights and evaluates more options.

### Off-Ball Movement — The Hardest Problem

**Off-ball movement** is the most critical AI system. How do players *without* the ball decide where to run?

Movement types:

- **Support run** (接应跑位): Move toward the ball carrier to offer a safe pass
- **Overlap run** (套边跑位): Full-back runs outside the winger
- **Diagonal run** (斜线跑位): Cut diagonally behind defenders to receive a through ball
- **Decoy run** (牵制跑位): Run to drag a defender away, creating space for others
- **Check run** (回撤接应): Move toward the ball to receive under pressure

Each player evaluates potential runs using an **influence map** (影响力图) — a grid overlay on the pitch that shows value and danger zones.

```python
def decide_off_ball_movplayer, ball_carrier, teammates, opponents):
    # Generate candidate positions
    candidates = generate_movement_candidates(player)

    # Score each candidate
    best_score = -inf
    best_position = player.position

    for candidate in candidates:
        # Tactical value of this position
        value = influence_map[candidate.x][candidate.y]

        # Distance from nearest opponent (want space)
        space = min_distance_to_opponents(candidate, opponents)

        # Passing lane quality
        lane_quality = evaluate_passing_lane(ball_carrier, candidate, opponents)

        # Role-specific bonus (strikers prefer forward positions)
        role_bonus = get_role_bonus(player.role, candidate)

        score = value + space * w1 + lane_quality * w2 + role_bonus

        if score > best_score:
            best_score = score
            best_position = candidate

    return best_position
```

**Why this is hard**: 11 players are all running this logic simultaneously. If they all run to the same "best" position, they cluster. You need coordination without explicit communication.

**Solution**: Add a "teammate proximity penalty" — positions near other teammates score lower.

### Defensive Shape

When the team loses the ball, the tactical AI reorganizes the defensive shape:

1. **Transition trigger**: Ball is lost — all players switch to defensive AI
2. **Recovery runs**: Players sprint back toward their defensive positions
3. **Compactness**: The team compresses horizontally and vertically to deny space
4. **Marking assignments**: Each defender is assigned a player or zone to cover

```python
def organize_defense(team, ball_position):
    # Compress the team shape
    target_width = 40  # meters (compact)
    target_depth = 30  # meters

    for player in team:
        # Calculate defensive position based on role
        defensive_pos = get_defensive_position(player.role, ball_position)

        # Assign marking if near an opponent
        nearest_opponent = find_nearest_opponent(player, opponents)
        if distance(player, nearest_opponent) < marking_threshold:
            player.mark_target = nearest_opponent

        # Move toward defensive position
        player.set_target_position(defensive_pos)
```

## Individual AI — Per-Player Decisions

At the individual level, each AI player makes frame-by-frame decisions.

### Behavior Trees

**Behavior trees** (行为树) are the most common architecture:

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
└── OpponentHasBa(Sequence)
    ├── NearestToBall? ──▶ PressOpponent
    ├── InDefensiveZone? ──▶ MarkAssignment
    └── Default ──▶ RecoverPosition
```

Behavior trees are easy to debug and extend. You can visualize them in real-time to see why a player made a decision.

### Utility AI

**Utility AI** (效用AI) scores multiple potential actions and picks the highest:

```python
def decide_action(player, context):
    actions = {
        "pass":    score_passing(player, context),
        "shoot":   score_shooting(player, context),
        "dribble": score_dribbling(player, context),
        "hold":    score_holding(player, context)
    }
    return max(actions, key=actions.get)

def score_shooting(player, context):
    distance = distance_to_goal(player)
    angle = angle_to_goal(player)
    defenders = count_blocking_defenders(player, goal)

    # Base score from player attribute
    base = player.finishing / 100.0

    # Distance factor (closer = better)
    distance_factor = 1.0 - (distance / max_shot_range)

    # Angle factor (central = better)
    angle_factor = angle / 45.0

    # Clear shot factor (fewer defenderer)
    clear_factor = 1.0 / (1 + defenders)

    return base * distance_factor * angle_factor * clear_factor
```

Utility AI is more flexible than behavior trees but harder to debug. You can't easily see *why* the AI chose an action — just that it scored highest.

### State Machines

Simpler games use **finite state machines** (FSM, 有限状态机):

```
States: Idle, ChaseBall, Dribble, Pass, Shoot, Defend, ReturnToPosition

Transitions:
  Idle → ChaseBall:         ball is loose and nearby
  ChaseBall → Dribble:      won the ball
  Dribble → Pass:           teammate is open and better positioned
  Dribble → Shoot:          within shooting range and angle
  Dribble → Def  lost the ball
  Any → ReturnToPosition:   ball is far away
```

FSMs are simple and fast but can feel robotic. Modern games use behavior trees or utility AI.

## Difficulty Scaling — The Hardest Design Problem

AI difficulty must be fun for both beginners and experts. This is *really* hard.

### Bad Approach: Attribute Scaling

**Don't do this**: Boost AI player stats on higher difficulties.

```python
# BAD: Unfair and frustrating
if difficulty == "legendary":
    ai_player.speed *= 1.3
    ai_player.shooting *= 1.5
```

This feels unfair. Players notice when the AI's slow defender suddenly catches their fast winger.

### Good Approach: Decision Quality

**Do this**: AI makes better/worse decisions based on difficulty.

```python
# GOOD: Natural and fair
if difficulty == "beginner":
    # AI only evaluates 3 nearest passing options
    passing_options = get_nearest_teammates(3)
elif difficulty == "legendary":
    # AI evaluates all 10 teammates and picks the best
    passing_options = get_all_teammates()
```

### Good Approach: Reaction Time

**Do this**: AI responds faster/slower based on difficulty.

```python
# GOOD: Subtle and effective
if difficulty == "beginner":
    ai_reaction_delay = 0.5  # seconds
elif difficulty == "legendary":
    ai_reaction_delay = 0.1  # seconds
```

### Good Approach: Error Injection

**Do this**: AI deliberately makes mistakes on lower difficulties.

```python
# GOOD: Very natural
if difficulty == "beginner":
    if random() < 0.3:  # 30% chance
        # AI makes a bad pass
        pass_target = random_teammate()
```

**Best approach**: Combine all three. Lower difficulties reduce decision quality, add reaction delay, and inject errors. Higher difficulties unlock advanced tactical patter## Teammate AI — The Unique Challenge

Teammate AI (controlling your 10 teammates) has unique constraints:

- **Must not outperform the human** — the human should feel like the star
- **Must be responsive** to the human's play style
- **Must not make obviously stupid mistakes** — players blame their AI teammates more than opponents
- **Should complement** the human's actions — e.g., making runs when the human has the ball

```python
def teammate_ai_decision(player, human_player, context):
    # If human has the ball, prioritize supporting them
    if human_player.has_ball:
        return make_supporting_run(player, human_player)

    # Otherwise, use normal AI but with reduced "hero" behavior
    action = normal_ai_decision(player, context)

    # Reduce likelihood of "stealing the spotlight"
    if action == "shoot" and distance(player, human_player) < 20:
        # Human is nearby, maybe pass to them instead
        if random() < 0.6:
            return pass_to(human_player)

    return action
```

## Key Takeaways

- Football AI uses a **three-layer hierarchy**: strategic (team), tactical (group), individual (player)
- **Off-ball movement** is the hardest and most impactful AI system
- Common individual AI architectures: **behavior trees** (most popular), **utility AI** (flexible), **state machines** (simple)
- Difficulty scaling should use **decision quality**, **reaction time**, and **error injection** — not stat boosts
- Teammate AI must be helpful without overshadowing (抢风头) the human player
- The best AI creates **emergent behavior** that looks like real football without being scripted

## Next Up

AI makes players smart, but [Architecture Patterns](08-architecture-patterns.html) make your codebase maintainable. Let's talk about how to structure a football game.
