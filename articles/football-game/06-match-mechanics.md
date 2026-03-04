---
layout: article
title: "Match Mechanics & Gameplay Systems"
description: "The core gameplay loop — passing, shooting, dribbling, defending, and how they all fit together"
lang: en
level: intermediate
tags: ["Game Design", "Mechanics", "Gameplay"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 6
prev:
  title: "Player Attributes & Rating Systems"
  url: "05-player-attributes.html"
next:
  title: "Football Game AI Design"
  url: "07-ai-design.html"
---

## The Core Gameplay Loop

Every football game cycles through this loop:

```
┌──────────────────────────────────────────────┐
│                                              │
│   Possess ──▶ Move ──▶ Attack ──▶ Outcome   │
│      ▲                               │       │
│      └───────── Transition ◀─────────┘       │
│                                              │
└──────────────────────────────────────────────┘
```

- **Possess**: Your team has the ball — who controls it?
- **Move**: Dribble, pass, or carry the ball forward
- **Attack**: Create and execute a scoring chance
- **Outcome**: Goal, save, miss, or turnover
- **Transition**: Switch between attack and defense

Every mechanic fits into one of these phases.

## Passing — The Most Frequent Action

Professional teams make 400-700 passes per game. Passing is the foundation of football.

### Pass Types

| Pass Type | Input | Behavior |
|-----------|-------|----------|
| Ground pass | Short press | Ball rolls along the ground |
| Through ball (直塞球) | Triangle / Y | Ball played into space ahead of a runner |
| Lob pass (挑传) | Long press | Aerial ball over defenders |
| Cross (传中) | Wide position + pass | Ball swung into the penalty area |
| Driven pass | Double tap | Fast, low ball with pace (力量) |

### Pass Accuracy Model

Pass accuracy is calculated using multiple factors:

```python
accuracy = base_accuracy \
    * attribute_modifier(passer.short_passing) \
    * distance_penalty(distance) \
    * angle_penalty(body_angle_to_target) \
    * pressure_modifier(nearby_defenders) \
    * fatigue_modifier(passer.current_stamina) \
    + random_error(-max_deviation, max_deviation)
```

The result determines an **error angle** — the deviation from perfect direction. The ball is then launched along this adjusted vector.

**Key insight**: Attributes don't guarantee success. They reduce the error range. A 99 passing player can still misplace a pass under pressure.

### Pass Assist

When a human player presses the pass button, the game must decide **who the pass goes to**. This is called pass assist (传球辅助):

- **Manual**: Ball goes exactly where the stick points — no assist
- **Semi-assisted**: Ball is nudged (微调) toward the nearest teammate in the aimed direction
- **Fully assisted**: Game selects the "best" target automatically

The selection algorithm uses a weighted score:

```python
score = w1 * direction_alignment \
      + w2 * distance_suitability \
      + w3 * receiver_openness \
      + w4 * tactical_value
```

Most players use semi-assisted — it feels responsive while preventing obvious mistakes.

## Shooting — The Payoff

### Shot Types

| Shot Type | Trigger | Characteristics |
|-----------|---------|-----------------|
| Normal shot | Shoot button | Power based on charge time |
| Finesse shot (巧射) | Modified shoot | Curled (弧线) into corners, less power |
| Power shot | Double tap | Maximum force, less accuracy |
| Chip shot (挑射) | Modified lob | Ball lobbed (吊射) over the goalkeeper |
| Header (头球) | Shoot during aerial cross | Headed toward goal |
| Volley (凌空抽射) | Shoot while ball is airborne | High difficulty, high reward |

### Shot Calculation Pipeline

```
Input (aim direction, charge time)
        │
        ▼
   Calculate base power & direction
        │
        ▼
   Apply attribute modifiers (finishing, shot_power, curve)
        │
        ▼
   Apply contextual modifiers (body angle, balance, pressure)
        │
        ▼
   Add controlled randomness (deviation based on composure)
        │
        ▼
   Generate ball physics impulse (velocity + spin vectors)
        │
        ▼
   Ball enters physics simulation
```

The **charge time** (蓄力时间) determines power — too little gives a weak shot, too much sends it over the bar. This creates a skill ceiling (技术上限) for the player.

**FIFA's timed finishing**: Press shoot again at the exact moment of contact for a bonus. Adds a rhythm game element to shooting.

## Dribbling and Ball Control

### Movement with the Ball

When a player has the ball, movement is modified:

- **Speed reduction**: Players move slower with the ball (~70-85% of sprint speed)
- **Touch frequency**: How often the player touches the ball while running. High ball control = tighter touches = harder to dispossess (抢断)
- **Turning radius**: High agility = sharper turns with the ball

### Skill Moves (技巧动作)

Skill moves are pre-animated sequences that let the player beat defenders:

| Move | Difficulty | Effect |
|------|------------|--------|
| Body feint (假动作) | 1 star | Shifts body to deceive (欺骗) defender |
| Step over (踩单车) | 2 star | Circular foot movement over the ball |
| Roulette (马赛回旋) | 3 star | 360-degree spin with the ball |
| Elastico (牛尾巴过人) | 4 star | Quick inside-outside flick |
| Rainbow flick (彩虹过人) | 5 star | Ball flicked over the head |

Each skill move is **gated** by the player's skill move rating (1-5 stars). The move plays a canned animation (预设动画) with specific invincibility frames where the ball cannot be tackled.

**Design trade-off**: Skill moves look cool but can feel "scripted" — the animation plays regardless of defender position. Some players love them, others find them unrealistic.

## Defending — Risk vs. Reward

### Defensive Actions

| Action | Input | Risk/Reward |
|--------|-------|-------------|
| Jockey (贴身防守) | Hold defend button | Low risk — maintain position, slow attacker |
| Standing tackle (正面铲抢) | Tap tackle | Medium risk — can win ball or commit foul |
| Sliding tackle (铲球) | Slide button | High risk — strong but may miss and leave gap |
| Shoulder charge (肩部对抗) | Hold + sprint | Contest physically without a tackle |
| Contain (压迫) | AI-assisted button | AI positions your player, you trigger tackle |

### Tackle Success Model

```python
success_chance = base_rate \
    * attribute_ratio(defender.tackling / attacker.dribbling) \
    * timing_window(button_press_timing) \
    * angle_modifier(approach_angle) \
    * ball_distance(distance_to_ball)

if random() < success_chance:
    ball_won()
elif random() < foul_chance:
    commit_foul(severity)
else:
    tackle_missed()
```

The **timing window** creates a skill element — pressing the tackle button at the exact right moment increases success. Similar to parry windows (格挡窗口) in fighting games.

**Design insight**: Defending is harder than attacking in most football games. This is intentional — it makes scoring feel rewarding.

## Goalkeeping — Semi-Automated

Goalkeeper mechanics are often semi-automated:

- **Positioning**: AI-controlled, based on ball position and shot angle
- **Diving**: Triggered by the shot event — the GK evaluates direction and dives based on reflexes attribute
- **One-on-one**: Special logic when an attacker breaks through — GK must decide to rush out (出击) or stay on the line
- **Distribution**: After a save, the GK can throw, punt, or pass to restart play

### Save Calculation

```python
save_probability = base_rate \
    * gk_reflexes_modifier \
    * gk_positioning_modifier  # was the GK in the right spot? \
    * shot_difficulty           # power, placement, distance \
    * reaction_time_available   # deflections reduce this
```

**Player control**: In FIFA, you can move the goalkeeper manually, but most players let the AI handle it. In PES, goalkeeper control is more manual.

## Set Pieces — Special Game States

### Free Kicks

Free kick shooting uses a special camera angle and aiming reticle (瞄准准星):

1. Player positions the aim point on the goal
2. Chooses curl direction (弧线方向) — left or right spin
3. Sets power with a charge bar
4. Timing and knuckleball (电梯球) effects add advanced options

**Design note**: Free kicks are a mini-game within the game. They have their own skill curve.

### Corner Kicks

Corner mechanics focus on **delivery type** and **target selection**:

- Aim the landing zone (near post, far post, edge of box)
- Choose delivery type (in-swinger, out-swinger, driven)
- AI-controlled attackers make timed runs (卡时间跑位) to meet the ball

### Penalties

Penalty mechanics are a mind game (心理博弈):

- **Shooter**: Aim direction + power + timing
- **Goalkeeper**: Guess the direction and dive
- Some games add a composure meter (沉着度计量表) — nervous players have a wider aim reticle (准星)

**Real-world data**: Professional players score ~75% of penalties. Your game should match this baseline on default difficulty.

## The Match State Machine

All these mechanics exist within a **match state machine**:

```
┌─────────┐    kick-off    ┌───────────┐
│ PreMatch│─────────────▶│  InPlay   │◀──────┐
              └─────┬─────┘       │
                                │              │
              ┌─────────────────┼──────────┐   │
              ▼                 ▼          ▼   │
        ┌──────────┐    ┌──────────┐  ┌──────┐│
        │ FreeKick │    │ ThrowIn  │  │Corner││
        └────┬─────┘    └────┬─────┘  └──┬───┘│
             │               │            │    │
             └───────────────┴────────────┴────┘
                          resume
              ┌───────────────────────────┐
              │       GoalScored          │
              └────────────┬──────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐            ┌──────────┐
        │ HalfTime │            │ FullTime │
        └──────────┘            └──────────┘
```

Each state has specific rules about which mechanics are available, how the camera behaves, and what the AI should do.

## Key Takeaways

- Every mechanic combines **player input**, **attribute modifiers**, and **controlled randomness**
- Pass/shot accuracy uses a **deviation model** — attributes reduce the ange, not guarantee success
- Defending is a **risk-reward system** — aggressive tackles win the ball or give away fouls
- Set pieces are **mini-games** with their own skill curves
- The match is governed by a **state machine** that controls transitions between open play, set pieces, and stoppages
- **Skill ceiling**: Simple to learn, hard to master — the best football games have depth without complexity

## Next Up

Mechanics define what players can do. [AI Design](07-ai-design.html) defines what the computer does. Let's talk about the hardest problem in football game development.
