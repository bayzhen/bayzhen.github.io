---
layout: article
title: "Football Rules & Match Structure"
description: "The essential rules of football explained for game developers — no fluff, just what you need to build a game"
lang: en
level: beginner
tags: ["Football", "Rules", "Fundamentals"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 1
next:
  title: "Player Positions & Roles"
  url: "02-player-positions.html"
---

## The 30-Second Version

Football (soccer): two teams, 11 players each, 90 minutes, one ball, two goals. Use your feet (mostly). Score more than the other team. That's it.

Everything else is details.

## Why You Need to Know This

You can't build a football game without understanding the rules. Not because you need to memorize the FIFA rulebook, but because every rule maps to a game system:

- **Offside** → spatial queries and AI positioning
- **Fouls** → collision detection and referee logic
- **Substitutions** → roster management UI
- **Penalty kicks** → special game state with different camera and controls

Think of football rules as your game design specification, written by 150 years of iteration.

## The Pitch (球场)

A football pitch is a rectangle, roughly 100m × 70m. Key zones:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────┐                                   ┌─────┐     │
│  │     │          Penalty Area             │     │     │
│  │  G  │          (禁区)                   │  G  │     │
│  │     │                                   │     │     │
│  └─────┘                                   └─────┘     │
│                                                         │
│                    Center Circle                        │
│                    (中圈)                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Penalty Area** (禁区): The big box in front of each goal. Fouls here = penalty kick.
**Goal Area** (小禁区): The small box. Mostly used for goal kicks.
**Center Circle** (中圈): Where kick-offs happen.

In your game engine, this is your world geometry. FIFA uses exact real-world dimensions. Rocket League... does not.

## Match Structure

| Phase | Duration | Notes |
|-------|----------|-------|
| First Half | 45 min | |
| Half-Time | 15 min | Tactical adjustments, substitutions |
| Second Half | 45 min | |
| Stoppage Time | +1–5 min | Referee adds time for injuries, delays |
| Extra Time | 2 × 15 min | Only in knockout matches |
| Penalties | Best of 5 | If still tied after extra time |

**Game Dev Decision**: Do you simulate 90 real minutes? Hell no. Most games compress time:

- **FIFA**: 6 minutes per half (12 min total)
- **Football Manager**: Simulated, no real-time
- **Rocket League**: 5 minutes, no halves

Choose based on your game's pacing. Arcade games go fast. Simulations go slower.

## How Play Starts and Restarts

Football has a state machine. Here are the states:

### Kick-Off (开球)
Starts the match, restarts after a goal. Ball placed at ce one team kicks forward.

### Throw-In (界外球)
Ball goes out on the sideline. Player throws it back in with both hands over their head. Yes, it looks silly. No, you can't score directly from a throw-in.

### Goal Kick (球门球)
Attacking team kicks the ball over the goal line (but not into the goal). Defending team restarts from their goal area.

### Corner Kick (角球)
Defending team kicks the ball over their own goal line. Attacking team gets a kick from the corner. Dangerous situation — lots of goals come from corners.

### Free Kick (任意球)
Awarded after a foul. Two types:

- **Direct** (直接任意球): Can score directly
- **Indirec: Must touch another player first

### Penalty Kick (点球)
The most dramatic moment in football. Foul in the penalty area = penalty. One attacker, one goalkeeper, 11 meters apart. Attacker has about a 75% chance of scoring.

In FIFA, penalties are a mini-game with aiming and power mechanics. In Football Manager, it's a dice roll modified by player attributes.

## Scoring

A goal counts when the **entire ball** crosses the goal line between the posts and under the crossbar.

"Entire ball" is key. If even 1mm of the ball is still on the line, no goal. Modern football uses **Goal-Line Technology** (门线技术) — cameras and sensorsat detect this instantly.

In your game, this is a collision detection problem:

```cpp
bool isGoal(Ball ball, GoalLine line) {
    return ball.position.x > line.position.x
        && ball.position.y > line.bottom
        && ball.position.y < line.top;
}
```

(Simplified, but you get the idea.)

## Offside (越位)

The most confusing rule in football. Here's the simple version:

**You can't cherry-pick.** You can't just stand next to the opponent's goal waiting for a long pass. You have to be behind the ball or behind at least two defenders when the pass is made.

More precisely: A player is offside if they're closer to the goal than both the ball and the second-to-last defender **at the moment the ball is passed**.

Key points:

1. You can't be offside in your own half
2. You can't be offside from a throw-in, corner, or goal kick
3. Being offside isn't a foul unless you interfere with play

**Why this rule exists**: Without it, football would be boring. Attackers would just camp near the goal, and every attack would be a long ball forward.

**Game dev challenge**: You need to track all player positions at the exact frame the pass happens. FIFA's AI constantly checks offside lines to position attackers.

## Fouls and Cards

Common fouls:

- **Tripping** (绊倒): Tackling the player instead of the ball
- **Pushing** (推人): Using hands to shove an opponent
- **Handball** (手球): Touching the ball with your hand/arm (goalkeepers excepted in their own area)

Referee can show:

- **Yellow Card** (黄牌): Warning. Two yellows = red.
- **Red Card** (红牌): Player is sent off. Team plays with 10 players for the rest of the match.

In FIFA, fouls are detected by collision angle and timing. Slide tackles from behind = likely foul. Clean tackle from the side = play on.

Most games simplify this. Football Manager just rolls dice based on player aggression and referee strictness.

## Substitutions (换人)

Each team can make **5 substitutions** per match (recently increased from 3). Once a player is subbed off, they can't come back.

**Tactical use**:
- Bring on fresh legs when players are tired
- Change formation (sub a defender for an attacker when losing)
- Waste time when winning (yes, this is a real tactic)

In FIFA, you pause and swap players. In Football Manager, you set substitution rules and the AI executes them.

## What You Actually Need to Remember

If you're building a football game, focus on these systems:

| Rule | Game System |
|------|-------------|
| Pitch layout | World geometry, camera bounds |
| Match timing | Game clock, time compression |
| Restarts | State machine (kick-off, throw-in, etc.) |
| Goal detection | Collision detection |
| Offside | Spatial queries, AI positioning |
| Fouls | Contact detection, referee AI |
| Substitutions | Roster management, UI |

You don't need to know every obscure rule. You need to know how rules become code.

## Next Up

Now that you know the rules, let's talk about [Player Positions & Roles](02-player-positions.html) — because not allayers do the same thing.
