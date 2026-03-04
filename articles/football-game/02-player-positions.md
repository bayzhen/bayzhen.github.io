---
layout: article
title: "Player Positions & Roles"
description: "From goalkeeper to striker — what each position does and why it matters for your game's AI and attribute system"
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

## Why Positions Matter for Game Dev

In real football, positions define where a player operates and what they're expected to do. In game development, positions are the foundation of:

- **Roster system** — organizing your player database
- **AI behavior** — where players run, when they pass, how they defend
- **Attribute weights** — which stats matter for each role
- **Heat maps** — where players spend most of their time

Think of positions as job descriptions for your AI agents.

## The Four Lines

Football positions are organized into four tiers from back to front:

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

Let's break down each tier and its specialized roles.

## Goalkeeper (GK)

The **goalkeeper** (守门员) is the last line of defense. Only player allowed to use hands (inside the penalty area).

**Key responsibilities:**
- Stop shots
- Catch crosses
- Distribute the ball to start attacks
- Organize the defense (shouting instructions)

**Key attributes:**

| Attribute | What It Does |
|-----------|--------------|
| Diving | Reaching shots in the corners |
| Handling | Catching and holding the ball |
| Reflexes | Reaction speed to close-range shots |
| Positioning | Being in the right spot |
| Kicking | Distribution accuracy |

**Game dev note**: Goalkeepers are often semi-automated. The AI handles positioning and diving; the player might control distribution.

## Defenders (DEF)

Defenders occupy the back line and prevent the opposition from scoring.

### Center-Back (CB) — 中后卫

The core of the defense, positioned centrally in front of the goalkeeper.

**What they do:**
- Win aerial duels (空中对抗) — heading the ball away
- Make tackles and interceptions
- Organize the defensive line

**Typical attributes:**
- Usually tall (6'0" / 183cm+) and physically strong
- High: Tackling, Heading, Strength, Marking
- Low: Pace, Dribbling (they don't need to be fast or skillful)

**Famous examples**: Virgil van Dijk, Sergio Ramos

### Full-Back (LB/RB) — 边后卫

Play on the left (LB) or right (RB) side of the defense.

**What they do:**
- Defend against opposing wingers
- **Overlap** (套边) — run forward along the sideline to support attacks
- Deliver crosses into the box

**Typical attributes:**
- High: Pace, Stamina, Crossing, Tackling
- Modern full-backs are expected to contribute to efense and attack

**Famous examples**: Trent Alexander-Arnold, Alphonso Davies

### Wing-Back (LWB/RWB) — 翼卫

A more offensive variant of the full-back, used in formations with three center-backs. Wing-backs cover the entire flank — defending and attacking.

**Game dev note**: Wing-backs have higher attacking work rates than full-backs in your AI system.

## Midfielders (MID)

Midfielders operate in the center of the pitch, linking defense and attack. Often the most versatile (全能的) players.

### Defensive Midfielder (CDM/DM) — 后腰

Sits in front of the defense, acting as a shield (屏障).

**What they do:**
- Break up opposition attackscept passes
- Recycle possession with simple, safe passes
- Sometimes called the "anchor" (锚点) or pivot (支点)

**Typical attributes:**
- High: Tackling, Positioning, Interceptions, Composure
- Low: Shooting, Dribbling (not their job)

**Famous examples**: N'Golo Kanté, Casemiro

### Central Midfielder (CM) — 中场中路

The engine of the team.

**What they do:**
- Distribute the ball
- Control tempo (节奏)
- Contribute to both defense and attack

**Typical attributes:**
- High: Passing, Vision, Stamina, Work Rate
- Balanced across most attributes

**Famous examples**: Kevin De Bruyne, Luka Modrić

### Attacking Midfielder (CAM/AM) — 前腰

Plays between midfield and the forwards. Often the most creative player — the playmaker (组织核心).

**What they do:**
- Create chances
- Deliver through balls (直塞球)
- Take shots from outside the box

**Typical attributes:**
- High: Creativity, Dribbling, Passing, Shooting
- Low: Tackling, Strength (not expected to defend much)

**Famous examples**: Bruno Fernandes, Martin Ødegaard

### Winger (LW/RW/LM/RM) — 边锋/边前卫

Play on the flanks and aim to beat defenders with speed or skill.

**What they do:**
- Deliver crosses into the box
- **Cut inside** to sho inverted winger (内切型边锋) is a modern trend
- Beat defenders 1v1 with dribbling

**Typical attributes:**
- High: Pace, Dribbling, Crossing, Agility
- Modern wingers often have high shooting too (for cutting inside)

**Famous examples**: Mohamed Salah, Vinícius Júnior

## Forwards (FWD)

Forwards are the primary goal-scorers.

### Striker / Center Forward (ST/CF) — 前锋/中锋

The main goal threat.

**What they do:**
- Finish chances created by teammates
- Hold up the ball, bring others into play
- Make runs behind the defense

**Typical attributes:**
- High: Finishing, Positioning, Heading, Composure
- Oftand strong, or fast and agile (differ types)

**Famous examples**: Erling Haaland, Harry Kane

### Second Striker / Support Striker (SS) — 影锋

Plays slightly behind the main striker, in the "hole" between midfield and attack.

**What they do:**
- Combine goal-scoring with chance creation
- Drop deep to receive the ball
- Link up with the main striker

**Typical attributes:**
- Balanced between striker and attacking midfielder
- High: Finishing, Passing, Dribbling

### False Nine — 伪九号

A modern tactical role where the center forward drops into midfield to create space and confuse defenders.

**Game dev note**: This is not a fixed position but a **behavioral pattern** (行为模式). In your AI system, it's a tactical instruction that modifies the striker's movement logic.

**Famous example**: Lionel Messi (at Barcelona)

## Position Maps for Game Development

When implementing positions in your game, each position maps to:

1. **Default coordinates** — starting position on the pitch
2. **Heat map zones** — areas where the player is most active
3. **Attribute weights** — which stats matter most
4. **AI behavior priorities** — defensive vs. e tendency

Example: Right-Back (RB) position definition

```json
{
  "position": "RB",
  "default_position": { "x": 35, "y": 55 },
  "heat_map_zones": [
    { "zone": "right_flank_defense", "weight": 0.6 },
    { "zone": "right_flank_attack", "weight": 0.3 },
    { "zone": "center_defense", "weight": 0.1 }
  ],
  "primary_attributes": ["pace", "stamina", "tackling", "crossing"],
  "ai_tendency": { "defense": 0.65, "attack": 0.35 }
}
```

## Summary Table

| Position | Abbr | Zone | Primary Role utes |
|----------|------|------|--------------|----------------|
| Goalkeeper | GK | Goal | Shot-stopping | Diving, Reflexes, Handling |
| Center-Back | CB | Center Defense | Defending | Tackling, Heading, Strength |
| Full-Back | LB/RB | Wide Defense | Defend + Overlap | Pace, Stamina, Crossing |
| Defensive Mid | CDM | Central | Shield defense | Tackling, Interceptions |
| Central Mid | CM | Central | Link play | Passing, Vision, Stamina |
| Attacking Mid | CAM | Central Attack | Create chances | Creativity, Dribbling |
| Winger | LW/RW | Wide Attacefenders | Pace, Dribbling, Crossing |
| Striker | ST | Central Attack | Score goals | Finishing, Positioning |

## What You Need to Remember

- Positions define **where players operate** and **what they're expected to do**
- Each position has **different attribute priorities** — pace matters for wingers, not for center-backs
- Modern football has **hybrid roles** (like wing-backs and false nines) that blur traditional boundaries
- In your game, positions drive **AI behavior**, **attribute weights**, and **heat maps**

## Next Up

Now that you know the positions, let's see how they fit together in [Tactics & Formations](03-tactics-formtml).
