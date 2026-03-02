---
layout: article
title: "Player Positions & Roles"
description: "Understanding football player positions, their responsibilities on the pitch, and how they translate to game attributes"
lang: en
level: beginner
tags: ["Football", "Positions", "Fundamentals"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 2
prev:
  title: "Football Rules & Match Structure"
  url: "01-football-rules.html"
next:
  title: "Tactics & Formations"
  url: "03-tactics-formations.html"
---

## 1. Overview

A football team consists of 11 players on the pitch, each assigned a specific **position** (位置). Positions define a player's primary area of responsibility and influence what attributes matter most for that role.

In game development, positions are the foundation of your **roster system** (阵容系统) and determine how AI-controlled players behave — where they run, when they pass, and how they *prioritize* (优先考虑) defensive vs. offensive actions.

## 2. The Four Lines

Football positions are organized into four broad *tiers* (层级) from back to front:

```
                    ┌─────────────┐
                    │  Goalkeeper  │  (守门员)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │        Defenders        │  (后卫)
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │       Midfielders       │  (中场)
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │        Forwards         │  (前锋)
              └────────────┼────────────┘
```

Each tier can have multiple specialized sub-roles. Let's examine them.

## 3. Goalkeeper (GK)

The **goalkeeper** (守门员, often abbreviated GK) is the last line of defense. They are the only player allowed to use their hands — but only inside the penalty area.

**Key responsibilities:**
- Shot-stopping: diving, *reflexes* (反应), positioning
- Commanding the penalty area: catching crosses, *punching* (击球) the ball clear
- Distribution: throwing or kicking the ball to teammates to start attacks
- Organizing the defense: shouting instructions, directing the *defensive line* (防线)

**Key attributes for game dev:**

| Attribute | Description |
| --- | --- |
| Diving | Ability to reach shots in the corners |
| Handling | Catching and holding the ball securely |
| Reflexes | Reaction speed to close-range shots |
| Positioning | Reading the play to be in the right spot |
| Kicking | Distribution accuracy over long distances |

## 4. Defenders (DEF)

Defenders occupy the back line and aim to prevent the opposition from scoring.

### 4.1 Center-Back (CB)

The **center-back** (中后卫) is the core of the defense, typically positioned centrally in front of the goalkeeper.

- Wins *aerial duels* (空中对抗) — heading the ball away from danger
- Makes *tackles* (铲球) and *interceptions* (拦截)
- Usually tall and physically strong
- Key attributes: **Marking** (盯人), **Tackling**, **Heading**, **Strength**

### 4.2 Full-Back (FB)

**Full-backs** (边后卫) play on the left (LB) or right (RB) side of the defense.

- Defend against opposing *wingers* (边锋)
- Modern full-backs are expected to *overlap* (套边) — run forward along the sideline to support attacks
- Key attributes: **Pace** (速度), **Stamina** (体力), **Crossing** (传中), **Tackling**

> 句型解析: "Modern full-backs are expected to overlap — run forward along the sideline to support attacks" — "be expected to" 表示"被期望做某事"；破折号后是对 overlap 的解释。

### 4.3 Wing-Back (WB)

A more *offensive variant* (进攻变体) of the full-back, used in formations with three center-backs. Wing-backs cover the entire flank — defending and attacking.

## 5. Midfielders (MID)

Midfielders operate in the center of the pitch, linking defense and attack. They are often the most *versatile* (全能的) players.

### 5.1 Central Midfielder (CM)

The **central midfielder** (中场中路球员) is the engine of the team.

- Distributes the ball, controls *tempo* (节奏)
- Contributes to both defense and attack
- Key attributes: **Passing**, **Vision** (视野), **Stamina**, **Work Rate** (跑动积极性)

### 5.2 Defensive Midfielder (CDM/DM)

The **defensive midfielder** (后腰) sits in front of the defense, acting as a *shield* (屏障).

- Breaks up opposition attacks, *intercepts* (拦截) passes
- Recycles possession with simple, safe passes
- Sometimes called the "anchor" (锚点) or *pivot* (支点)
- Key attributes: **Tackling**, **Positioning**, **Interceptions**, **Composure** (沉着)

### 5.3 Attacking Midfielder (CAM/AM)

The **attacking midfielder** (前腰) plays between midfield and the forwards.

- Creates chances, delivers *through balls* (直塞球)
- Often the most creative player on the team — the *playmaker* (组织核心)
- Key attributes: **Creativity** (创造力), **Dribbling** (盘带), **Passing**, **Shooting**

### 5.4 Wide Midfielder / Winger (LM/RM/LW/RW)

**Wingers** (边锋/边前卫) play on the flanks and aim to beat defenders with speed or skill.

- Deliver **crosses** (传中球) into the box
- Cut inside to shoot — the *inverted winger* (内切型边锋) is a modern tactical trend
- Key attributes: **Pace**, **Dribbling**, **Crossing**, **Agility** (灵活性)

## 6. Forwards (FWD)

Forwards are the primary goal-scorers.

### 6.1 Striker / Center Forward (ST/CF)

The **striker** (前锋/中锋) is the main goal threat.

- *Finishes* (终结) chances created by teammates
- Holds up the ball, brings others into play
- Key attributes: **Finishing** (射术), **Positioning**, **Heading**, **Composure**

### 6.2 Second Striker / Support Striker (SS)

Plays slightly behind the main striker, in the "hole" between midfield and attack.

- More creative than a pure striker — combines goal-scoring with *chance creation* (创造机会)
- Often *drops deep* (回撤) to receive the ball

### 6.3 False Nine

A modern tactical role where the center forward *drops into midfield* (回撤到中场) to create space and confuse defenders. This is not a fixed position but a *behavioral pattern* (行为模式) — important for AI programming.

> 句型解析: "A modern tactical role where the center forward drops into midfield to create space and confuse defenders" — "where" 引导定语从句，修饰 role；"to create... and confuse..." 是目的状语。

## 7. Position Maps for Game Development

When implementing positions in your game, each position maps to:

1. **Default coordinates** on the pitch (the starting position)
2. **Heat map zones** — areas where the player is most active
3. **Attribute weights** — which stats matter most
4. **AI behavior priorities** — defensive vs. offensive tendency

```
Example: A Right-Back (RB) position definition

default_position: { x: 35, y: 55 }    // right side, near own goal
heat_map_zones: [
  { zone: "right_flank_defense", weight: 0.6 },
  { zone: "right_flank_attack",  weight: 0.3 },
  { zone: "center_defense",      weight: 0.1 }
]
primary_attributes: ["pace", "stamina", "tackling", "crossing"]
ai_tendency: { defense: 0.65, attack: 0.35 }
```

## 8. Summary Table

| Position | Abbr | Zone | Primary Role | Key Attributes |
| --- | --- | --- | --- | --- |
| Goalkeeper | GK | Goal | Shot-stopping | Diving, Reflexes, Handling |
| Center-Back | CB | Center Defense | Defending | Tackling, Heading, Strength |
| Full-Back | LB/RB | Wide Defense | Defend + Overlap | Pace, Stamina, Crossing |
| Defensive Mid | CDM | Central | Shield defense | Tackling, Interceptions |
| Central Mid | CM | Central | Link play | Passing, Vision, Stamina |
| Attacking Mid | CAM | Central Attack | Create chances | Creativity, Dribbling |
| Winger | LW/RW | Wide Attack | Beat defenders | Pace, Dribbling, Crossing |
| Striker | ST | Central Attack | Score goals | Finishing, Positioning |
