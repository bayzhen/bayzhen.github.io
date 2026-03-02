---
layout: article
title: "Match Mechanics & Gameplay Systems"
description: "Core gameplay mechanics in football games — passing, shooting, dribbling, tackling, and set pieces from a developer's perspective"
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

## 1. The Core Gameplay Loop

At its heart, a football game cycles through a *tight* (紧凑的) gameplay loop:

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
- **Attack**: Create and *execute* (执行) a scoring chance
- **Outcome**: Goal, save, miss, or turnover
- **Transition**: Switch between attack and defense

Every mechanic described below fits into one of these phases.

## 2. Passing

Passing is the most frequent action in a football match — professional teams make 400–700 passes per game.

### Types of Passes

| Pass Type | Input | Behavior |
| --- | --- | --- |
| Ground pass | Short button press | Ball rolls along the ground to target |
| Through ball (直塞球) | Triangle / Y | Ball played into space ahead of a runner |
| Lob pass (挑传) | Long press | Aerial ball over defenders |
| Cross (传中) | Wide position + pass | Ball swung into the penalty area |
| Driven pass | Double tap | Fast, low ball with *pace* (力量) |

### Pass Accuracy Model

Pass accuracy is calculated using:

```
accuracy = base_accuracy
    * attribute_modifier(passer.short_passing)
    * distance_penalty(distance)
    * angle_penalty(body_angle_to_target)
    * pressure_modifier(nearby_defenders)
    * fatigue_modifier(passer.current_stamina)
    + random_error(-max_deviation, max_deviation)
```

> 句型解析: 上面的伪代码展示了传球精度的计算方式。每个 modifier（修正因子）将基础精度按比例调整。distance_penalty 意为"距离惩罚"，距离越远精度越低。

The result determines an **error angle** — the deviation from perfect direction. The ball is then launched along this adjusted vector.

### Pass Target Selection

When a human player presses the pass button, the game must decide **who the pass goes to**. This is called *pass assist* (传球辅助):

- **Manual**: Ball goes exactly where the stick points — no assist
- **Semi-assisted**: Ball is *nudged* (微调) toward the nearest teammate in the aimed direction
- **Fully assisted**: Game selects the "best" target automatically

The selection algorithm typically uses a weighted score:

```
score = w1 * direction_alignment
      + w2 * distance_suitability
      + w3 * receiver_openness
      + w4 * tactical_value
```

## 3. Shooting

### Shot Types

| Shot Type | Trigger | Characteristics |
| --- | --- | --- |
| Normal shot | Shoot button | Power based on charge time |
| Finesse shot (巧射) | Modified shoot | *Curled* (弧线) into corners, less power |
| Power shot | Double tap | Maximum force, less accuracy |
| Chip shot (挑射) | Modified lob | Ball *lobbed* (吊射) over the goalkeeper |
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

The **charge time** (蓄力时间) determines power — too little gives a weak shot, too much sends it over the bar. This creates a *skill ceiling* (技术上限) for the player.

## 4. Dribbling and Ball Control

### Movement with the Ball

When a player has the ball, movement is modified:

- **Speed reduction**: Players move slower with the ball (~70-85% of sprint speed)
- **Touch frequency**: How often the player touches the ball while running. High ball control = tighter touches = harder to *dispossess* (抢断)
- **Turning radius**: High agility = sharper turns with the ball

### Skill Moves (技巧动作)

Skill moves are *pre-animated* (预制动画的) sequences that let the player beat defenders:

| Move | Difficulty | Effect |
| --- | --- | --- |
| Body feint (假动作) | 1 star | Shifts body to *deceive* (欺骗) defender |
| Step over (踩单车) | 2 star | Circular foot movement over the ball |
| Roulette (马赛回旋) | 3 star | 360-degree spin with the ball |
| Elastico (牛尾巴过人) | 4 star | Quick inside-outside flick |
| Rainbow flick (彩虹过人) | 5 star | Ball flicked over the head |

Each skill move is gated by the player's **skill move rating** (1–5 stars). The move plays a *canned animation* (预设动画) with specific invincibility frames where the ball cannot be tackled.

> 句型解析: "gated by the player's skill move rating" — "gated by" 意为"受...限制/控制"，类似于游戏设计中的"门槛机制"。

## 5. Defending

### Defensive Actions

| Action | Input | Risk/Reward |
| --- | --- | --- |
| Jockey (贴身防守) | Hold defend button | Low risk — maintain position, slow attacker |
| Standing tackle (正面铲抢) | Tap tackle | Medium risk — can win ball or commit foul |
| Sliding tackle (铲球) | Slide button | High risk — strong but may miss and leave gap |
| Shoulder charge (肩部对抗) | Hold + sprint | Contest physically without a tackle |
| Contain (压迫) | AI-assisted button | AI positions your player, you trigger tackle |

### Tackle Success Model

```
success_chance = base_rate
    * attribute_ratio(defender.tackling / attacker.dribbling)
    * timing_window(button_press_timing)
    * angle_modifier(approach_angle)
    * ball_distance(distance_to_ball)

if random() < success_chance:
    ball_won()
else if random() < foul_chance:
    commit_foul(severity)
else:
    tackle_missed()
```

The **timing window** creates a skill element — pressing the tackle button at the exact right moment increases success. This is similar to *parry windows* (格挡窗口) in fighting games.

## 6. Goalkeeping

Goalkeeper mechanics are often *semi-automated* (半自动的):

- **Positioning**: AI-controlled, based on ball position and shot angle
- **Diving**: Triggered by the shot event — the GK evaluates direction and *dives* (扑救) based on reflexes attribute
- **One-on-one**: Special logic when an attacker breaks through — GK must decide to *rush out* (出击) or stay on the line
- **Distribution**: After a save, the GK can throw, punt, or pass to restart play

### Save Calculation

```
save_probability = base_rate
    * gk_reflexes_modifier
    * gk_positioning_modifier  // was the GK in the right spot?
    * shot_difficulty           // power, placement, distance
    * reaction_time_available   // deflections reduce this
```

## 7. Set Piece Mechanics

### Free Kicks

Free kick shooting typically uses a special camera angle and *aiming reticle* (瞄准准星):

1. Player positions the aim point on the goal
2. Chooses *curl direction* (弧线方向) (left or right spin)
3. Sets power with a charge bar
4. Timing and *knuckleball* (电梯球) effects add advanced options

### Corner Kicks

Corner mechanics focus on **delivery type** and **target selection**:

- Aim the landing zone (near post, far post, edge of box)
- Choose delivery type (in-swinger, out-swinger, driven)
- AI-controlled attackers make *timed runs* (卡时间跑位) to meet the ball

### Penalties

Penalty mechanics are a *mind game* (心理博弈):

- **Shooter**: Aim direction + power + timing
- **Goalkeeper**: Guess the direction and dive
- Some games add a *composure meter* (沉着度计量表) — nervous players have a wider aim *reticle* (准星)

## 8. Game State Machine

All these mechanics exist within a **match state machine**:

```
┌─────────┐    kick-off    ┌───────────┐
│  PreMatch │─────────────▶│  InPlay   │◀──────┐
└─────────┘               └─────┬─────┘       │
                                │              │
              ┌─────────────────┼──────────┐   │
              ▼                 ▼          ▼   │
        ┌──────────┐    ┌──────────┐  ┌──────┐│
        │  FreeKick │    │  ThrowIn │  │Corner││
        └────┬─────┘    └────┬─────┘  └──┬───┘│
             │               │            │    │
             └───────────────┴────────────┴────┘
                          resume
              ┌───────────────────────────┐
              │         GoalScored        │
              └────────────┬──────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐            ┌──────────┐
        │ HalfTime │            │ FullTime │
        └──────────┘            └──────────┘
```

Each state has specific rules about which mechanics are available, how the camera behaves, and what the AI should do.

## 9. Key Takeaways

- Every mechanic combines **player input**, **attribute modifiers**, and **controlled randomness**
- Pass/shot accuracy uses a *deviation model* (偏差模型) — attributes reduce the error range, not guarantee success
- Defending is a *risk-reward system* (风险收益系统) — aggressive tackles win the ball or give away fouls
- The match is governed by a **state machine** that controls transitions between open play, set pieces, and stoppages
