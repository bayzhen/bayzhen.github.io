---
layout: article
title: "Tactics & Formations"
description: "From 4-4-2 to false nines — how formations work and why they matter for your AI system"
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

## What is a Formation?

A **formation** (阵型) describes how the 10 outfield players (excluding the goalkeeper) are arranged on the pitch. It's written as a series of numbers from defense to attack.

**4-4-2** = 4 defenders, 4 midfielders, 2 forwards.

In game development, formations define the **default spatial layout** of your team. Every AI decision — positioning, movement, passing options — starts from the formation as its baseline (基准).

Think of formations as the "home position" for each player. When the ball is lost, players return to their formation positions. When attacking, they deviate from it.

## The Classic Formations

### 4-4-2 — The Traditional Choice

```
         ST        ST
    LM   CM   CM   RM
    LB   CB   CB   RB
             GK
```

**What it does:**
- Balanced defense and attack
- Two strikers provide partnership and width
- Solid midfield line

**Weaknesses:**
- Can be outnumbered (以少打多) in central midfield against teams using three CMs
- Relies on wide midfielders to cover a lot of ground

**Famous users**: Manchester United (1990s), Atlético Madrid

**Game dev note**: This is often the default formation in tutorials because it's easy to understand.

### 4-3-3 — The Modern Standard

```
    LW        ST        RW
         CM   CM   CM
    LB   CB   CB   RB
             GK
```

**What it does:**
- Wide attackers stretch the defense (拉开防线)
- Strong pressing capability
- Dominant in possession (控球)

**Weaknesses:**
- Wingers must track back to defend, or the full-backs become exposed (暴露的)
- Requires high stamina from midfielders

**Famous users**: Barcelona (Guardiola era), Liverpool (Klopp)

**Game dev note**: This formation requires sophisticated off-ball movement AI — the wingers need to know when to cut inside vs. stay wide.

### 4-2-3-1 — The Modern Default

```
              ST
    LW       CAM       RW
         CDM      CDM
    LB   CB   CB   RB
             GK
```

**What it does:**
- Defensive solidity (稳固性) from the double pivot (双后腰)
- Creative freedom for the CAM
- Wide players provide attacking width

**Weaknesses:**
- The lone striker can become isolated (孤立的) without support
- Requires a world-class CAM to make it work

**Famous users**: Real Madrid, Chelsea

**Game dev note**: This is FIFA's most popular formation. The double CDM provides defensive stability while the attacking four create chances.

### 3-5-2 — The Wing-Back System

```
         ST        ST
              CAM
    LWB  CM        CM  RWB
         CB   CB   CB
              GK
```

**What it does:**
- Numerical superiority (人数优势) in midfield
- Wing-backs cover entire flanks
- Three CBs provide strong central defense

**Weaknesses:**
- Demands extremely fit wing-backs
- Vulnerable on the flanks if wing-backs are caught out of position (不在位)

**Famous users**: Italy (Euro 2020), Inter Milan (Conte)

**Game dev note**: Wing-backs need special AI logic — they must dynamically shift between defensive and attacking positions based on ball location.

### 5-3-2 / 5-4-1 — The Defensive Wall

```
              ST
         CM   CM   CM
    LWB  CB   CB   CB  RWB
              GK
```

**What it does:**
- Prioritizes not conceding goals
- Five defenders create a wall
- Compact shape denies space

**Weaknesses:**
- Limited attacking threat
- Can invite pressure and tire out defenders

**Famous users**: Teams protecting a lead, underdogs against stronger opponents

**Game dev note**: This formation is often used by AI when protecting a lead in the final minutes. Your strategic AI layer should trigger this shift.

## Tactical Concepts

Beyond formations, there are tactical principles that affect how teams play:

### Pressing (压迫)

**High press** (高位逼抢): Pressure the opponent in their own half, force mistakes.
- Requires high stamina and coordination
- Risk: If beaten, defense is exposed

**Low block** (低位防守): Sit deep, defend near your own goal, counter-attack.
- Conserves energy
- Risk: Invites pressure, hard to create chances

**Game dev implementation**: Pressing is controlled by a "defensive line height" parameter (0-100). High press = 80+, low block = 30-.

### Width vs. Compactness

**Wide play**: Spread out horizontally, use the full width of the pitch.
- Creates space in the center
- Requires good crossing and aerial ability

**Compact play**: Squeeze together, deny space to opponents.
- Easier to maintain defensive shape
- Harder to create chances

**Game dev implementation**: Team width is a parameter that affects player positioning. Wide = players stay near sidelines, compact = players cluster centrally.

### Tempo (节奏)

**Fast tempo**: Quick passes, rapid transitions, high intensity.
- Catches opponents off-guard
- Tires out your own players

**Slow tempo**: Patient build-up, control possession, wait for openings.
- Conserves energy
- Can be boring to watch/play

**Game dev implementation**: Tempo affects pass speed, player movement speed, and AI decision-making frequency.

## Formation Fluidity

Modern football doesn't use static formations. Teams shift shape based on context:

**In possession** (attacking):
- Full-backs push forward
- Defensive midfielders drop between center-backs
- Wingers cut inside or stay wide

**Out of possession** (defending):
- Full-backs drop back
- Midfielders compress centrally
- Forwards press or drop deep

**Example**: A 4-3-3 in possession might become a 2-3-5 when attacking and a 4-5-1 when defending.

**Game dev implementation**: This requires dynamic position adjustment based on ball location and game state. Your AI needs to calculate "attacking position" and "defensive position" for each player.

```python
def get_target_position(player, ball_location, team_has_ball):
    if team_has_ball:
        # Attacking position
        base_pos = player.formation_position
        push_forward = player.role.attacking_tendency * 10  # meters
        return base_pos + Vec2(0, push_forward)
    else:
        # Defensive position
        base_pos = player.formation_position
        drop_back = player.role.defensive_tendency * 10  # meters
        return base_pos - Vec2(0, drop_back)
```

## Special Roles

Some tactical roles don't fit neatly into formations:

### False Nine (伪九号)

A striker who drops into midfield to create space and confuse defenders.

**Game dev implementation**: This is a behavioral modifier, not a position. The striker's AI prioritizes dropping deep over staying high.

### Inverted Winger (内切型边锋)

A winger who cuts inside onto their stronger foot to shoot.

**Example**: A left-footed player on the right wing cuts into shoot with their left foot.

**Game dev implementation**: Winger AI checks player's strong foot and adjusts movement patterns accordingly.

### Regista (组织型后腰)

A deep-lying playmaker who controls the game from a defensive midfield position.

**Famous example**: Andrea Pirlo

**Game dev implementation**: High passing and vision attributes, AI prioritizes long passes over defensive actions.

## Formation Data Structure

In your game, formations are typically stored as data:

```json
{
  "formation_id": "4-3-3",
  "name": "4-3-3 Attack",
  "positions": [
    { "rK", "x": 5, "y": 50 },
    { "role": "LB", "x": 20, "y": 15 },
    { "role": "CB", "x": 20, "y": 35 },
    { "role": "CB", "x": 20, "y": 65 },
    { "role": "RB", "x": 20, "y": 85 },
    { "role": "CM", "x": 40, "y": 30 },
    { "role": "CM", "x": 40, "y": 50 },
    { "role": "CM", "x": 40, "y": 70 },
    { "role": "LW", "x": 70, "y": 20 },
    { "role": "ST", "x": 75, "y": 50 },
    { "role": "RW", "x": 70, "y": 80 }
  ],
  "tactical_settings": {
    "defensive_line": 60,
    "width": 70,
    "tempo": 65,
    "pressing": 75
  }
}
```

## Key Takeaways

- Formations define the **default spatial layout** of your team
- Modern football uses **fluid formations** that shift based on ball location
- Tactical concepts like **pressing**, **width**, and **tempo** are parameters that affect AI behavior
- Special roles like **false nine** and **inverted winger** are behavioral modifiers, not fixed positions
- In your code, formations are **data-driven** — stored as JSON/XML and loaded at runtime

## Next Up

Now that you understand formations, let's zoom out and look at [Football Game Genres](04-game-genre-overview.html) — because not all football games are the same.
