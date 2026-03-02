---
layout: article
title: "Tactics & Formations"
description: "Common football formations, tactical principles, and how they influence game AI and team behavior systems"
lang: en
level: beginner
tags: ["Football", "Tactics", "Formations"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 3
prev:
  title: "Player Positions & Roles"
  url: "02-player-positions.html"
next:
  title: "Football Game Genre Overview"
  url: "04-game-genre-overview.html"
---

## 1. What is a Formation?

A **formation** (阵型) describes how the 10 outfield players (excluding the goalkeeper) are *arranged* (布置) on the pitch. It is written as a series of numbers from defense to attack.

For example, **4-4-2** means: 4 defenders, 4 midfielders, 2 forwards.

In game development, formations define the **default spatial layout** of your team. Every AI decision — positioning, movement, passing options — starts from the formation as its *baseline* (基准).

## 2. Classic Formations

### 2.1 The 4-4-2

The most traditional and widely understood formation.

```
         ST        ST
    LM   CM   CM   RM
    LB   CB   CB   RB
             GK
```

**Strengths:** Balanced defense and attack, two strikers provide width and partnership, solid midfield line.

**Weaknesses:** Can be *outnumbered* (以少打多) in central midfield against teams using three central midfielders.

### 2.2 The 4-3-3

A more *attack-oriented* (进攻导向的) formation with three forwards.

```
    LW        ST        RW
         CM   CM   CM
    LB   CB   CB   RB
             GK
```

**Strengths:** Wide attackers *stretch the defense* (拉开防线), strong pressing capability, dominant in *possession* (控球).

**Weaknesses:** Wingers must track back to defend, or the full-backs become *exposed* (暴露的).

### 2.3 The 4-2-3-1

The modern *default* for many professional teams.

```
              ST
    LW       CAM       RW
         CDM      CDM
    LB   CB   CB   RB
             GK
```

**Strengths:** Defensive *solidity* (稳固性) from the double pivot (双后腰), creative freedom for the CAM, wide players provide attacking width.

**Weaknesses:** The lone striker can become *isolated* (孤立的) without support.

> 句型解析: "The lone striker can become isolated without support" — "lone" 意为"单独的"，"isolated" 意为"被孤立的"。整句意为"单前锋在缺乏支援时可能陷入孤立"。

### 2.4 The 3-5-2

Uses three center-backs with wing-backs providing width.

```
         ST        ST
              CAM
    LWB  CM        CM  RWB
         CB   CB   CB
              GK
```

**Strengths:** *Numerical superiority* (人数优势) in midfield, wing-backs cover entire flanks, three CBs provide strong central defense.

**Weaknesses:** Demands extremely fit wing-backs; vulnerable on the flanks if wing-backs are caught *out of position* (不在位).

### 2.5 The 5-3-2 / 5-4-1

A *defensive* (防守型的) setup that prioritizes not conceding goals.

```
              ST
         CM   CM   CM
    LWB  CB  CB  CB  RWB
              GK
```

Used when a team needs to protect a lead or faces a much stronger opponent. In game terms, this is your "park the bus" (摆大巴, 全力防守) AI mode.

## 3. Tactical Principles

Beyond formations, football tactics involve several key principles that directly map to game systems:

### 3.1 Pressing (逼抢)

**Pressing** means actively *closing down* (逼近) the opponent when they have the ball, rather than waiting in your own half.

- **High press** (高位逼抢): Press the opponent near *their* goal. Risky but can force errors.
- **Mid-block** (中场防守): Defend around the halfway line. Balanced approach.
- **Low block** (低位防守): Sit deep near your own goal. Very *compact* (紧凑的) and hard to break down.

In game AI, pressing is controlled by a **press trigger** — when should your players start pressing? Options include: loss of possession, ball in a certain zone, or specific opponent behavior.

### 3.2 Build-Up Play (组织进攻)

How a team moves the ball from defense to attack:

- **Short build-up** (短传推进): Patient passing from the back, through midfield. Requires high passing skill across the team.
- **Long ball** (长传冲吊): Direct passes from defense to attack, *bypassing* (跳过) midfield. Relies on a strong target forward.
- **Counter-attack** (反击): Defend deep, win the ball, then attack quickly with pace. The *transition* (转换) from defense to attack is the critical moment.

> 句型解析: "Direct passes from defense to attack, bypassing midfield" — 现在分词 "bypassing" 作伴随状语，表示"在跳过中场的情况下"。

### 3.3 Width and Depth (宽度与纵深)

- **Width** (宽度): Spreading players across the pitch to *stretch* (拉扯) the defense horizontally
- **Depth** (纵深): Having players at different vertical positions to create passing lanes and space

In game AI, these concepts translate to **spatial distribution algorithms** — how your AI agents decide where to stand relative to each other.

### 3.4 Marking Systems (盯人体系)

- **Man-marking** (人盯人): Each defender is assigned a specific opponent to follow
- **Zonal marking** (区域防守): Defenders cover specific areas rather than specific players
- **Hybrid** (混合型): A combination — e.g., zone defense with man-marking on key players

This is a core AI decision system: does each defender track a specific enemy, guard a zone, or use a weighted combination?

## 4. Set Pieces (定位球)

**Set pieces** are pre-planned routines for restarts — corners, free kicks, and throw-ins. They account for roughly 30% of goals in professional football.

### Corner Kicks (角球)

Common *routines* (套路):

- **In-swinger** (内旋球): Ball curves toward the goal
- **Out-swinger** (外旋球): Ball curves away from the goal
- **Short corner** (短角球): Passed to a nearby teammate instead of crossed into the box
- **Near-post flick** (前点蹭射): Targeting the near post for a header

### Free Kicks (任意球)

- **Direct shot** (直接射门): Aim for goal, often with *curl* (弧线) or *knuckleball* (电梯球) technique
- **Crossed delivery** (传中): Swing the ball into the box
- **Indirect pass** (间接传球): Short pass to reset play

In game design, set pieces can be implemented as *scripted sequences* (脚本序列) with player *waypoints* (路径点) and timed runs.

## 5. Tactical Settings in Football Games

Most football games expose the following tactical controls to the player:

| Setting | Options | Effect |
| --- | --- | --- |
| Formation | 4-4-2, 4-3-3, etc. | Player positioning layout |
| Mentality (心态) | Defensive / Balanced / Attacking | Risk tolerance |
| Width | Narrow / Normal / Wide | Horizontal spacing |
| Depth / Line Height | Deep / Normal / High | Defensive line position |
| Pressing Intensity | Low / Medium / High | How aggressively to close down |
| Build-Up Speed | Slow / Normal / Fast | Passing tempo |
| Chance Creation | Possession / Direct / Counter | Attack style |
| Defensive Style | Zone / Man-mark | Marking system |

These settings are typically *parameterized* (参数化的) and fed into the AI decision-making system to control team behavior.

## 6. Formation Data Structure

For game developers, a formation can be represented as:

```
formation_442 = {
  name: "4-4-2",
  positions: [
    { role: "GK",  x: 50, y: 5 },
    { role: "LB",  x: 15, y: 30 },
    { role: "CB",  x: 35, y: 25 },
    { role: "CB",  x: 65, y: 25 },
    { role: "RB",  x: 85, y: 30 },
    { role: "LM",  x: 15, y: 50 },
    { role: "CM",  x: 35, y: 48 },
    { role: "CM",  x: 65, y: 48 },
    { role: "RM",  x: 85, y: 50 },
    { role: "ST",  x: 35, y: 80 },
    { role: "ST",  x: 65, y: 80 }
  ],
  mentality_modifiers: {
    defensive: { depth: -10, width: -5 },
    attacking: { depth: +15, width: +5 }
  }
}
```

Positions are normalized coordinates (0–100 for both axes), adjusted at runtime by mentality, game state, and individual player roles.

## 7. Key Takeaways

- Formations are the *skeleton* (骨架) of team AI — they define default positions and movement patterns
- Tactical principles (pressing, build-up, width/depth) are **behavioral parameters** that modify how the formation operates
- Set pieces are *choreographed* (精心编排的) special-case routines
- Most football games expose 8–12 tactical settings that map directly to AI parameters
