---
layout: article
title: "Player Attributes & Rating Systems"
description: "How football games define player abilities through numerical attribute systems, overall ratings, and potential growth"
lang: en
level: intermediate
tags: ["Game Design", "Attributes", "Rating"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 5
prev:
  title: "Football Game Genre Overview"
  url: "04-game-genre-overview.html"
next:
  title: "Match Mechanics & Gameplay Systems"
  url: "06-match-mechanics.html"
---

## 1. Why Attributes Matter

In football games, every player is defined by a set of **numerical attributes** (数值属性) that *quantify* (量化) their abilities. These numbers drive everything: how fast a player runs, how accurately they pass, how well they tackle.

The attribute system is the *connective tissue* (连接纽带) between design and engineering — it links the player database to the animation system, physics engine, and AI decision-making.

> 句型解析: "The attribute system is the connective tissue between design and engineering" — "connective tissue" 原意为"结缔组织"，此处比喻为"连接纽带"，意为属性系统是设计和工程之间的桥梁。

## 2. Attribute Categories

Most simulation football games organize attributes into 6 categories:

### 2.1 Pace (速度)

| Attribute | Description |
| --- | --- |
| Acceleration | How quickly a player reaches top speed |
| Sprint Speed | Maximum running velocity |

These directly affect the *locomotion* (移动) system — translating to movement speed curves and animation playback rates.

### 2.2 Shooting (射门)

| Attribute | Description |
| --- | --- |
| Finishing | Accuracy when shooting inside the box |
| Shot Power | Force behind the ball when striking |
| Long Shots | Accuracy from outside the penalty area |
| Volleys | Ability to strike the ball mid-air |
| Penalties | *Composure* (沉着) during penalty kicks |

In the physics engine, these attributes modify the ball's initial velocity vector, spin, and *deviation* (偏差) from the target.

### 2.3 Passing (传球)

| Attribute | Description |
| --- | --- |
| Vision | Ability to spot *viable* (可行的) passing options |
| Crossing | Accuracy of crosses from wide positions |
| Short Passing | Accuracy of ground passes over short distances |
| Long Passing | Accuracy of aerial passes over long distances |
| Curve | Ability to *curl* (旋转) the ball on passes and shots |

Vision is particularly interesting from an AI *perspective* (角度) — it determines how many passing options the AI evaluates and how creative the choices are.

### 2.4 Dribbling (盘带)

| Attribute | Description |
| --- | --- |
| Agility | Ability to change direction quickly |
| Balance | Stability when *challenged* (受到对抗时) by opponents |
| Ball Control | First touch quality and close control |
| Dribbling | Ability to move with the ball past defenders |
| Composure | Performance under pressure in *high-stakes* (高风险的) situations |

### 2.5 Defending (防守)

| Attribute | Description |
| --- | --- |
| Interceptions | Reading passes and cutting them out |
| Heading Accuracy | Winning and directing *aerial duels* (空中球) |
| Marking | Staying close to assigned opponents |
| Standing Tackle | Winning the ball while staying on feet |
| Sliding Tackle | Winning the ball with a slide tackle |

### 2.6 Physical (身体素质)

| Attribute | Description |
| --- | --- |
| Jumping | Vertical leap height |
| Stamina | *Endurance* (耐力) over 90 minutes |
| Strength | Ability to hold off opponents physically |
| Aggression | *Intensity* (积极性) of challenges and pressing |

## 3. Overall Rating (OVR)

The **Overall Rating** is a single number (typically 1–99) that *summarizes* (概括) a player's ability. However, it is **not** a simple average of all attributes.

### Weighted Calculation

The OVR is calculated using **position-specific weights**:

```
// Striker OVR calculation (simplified)
ovr_striker = (
    finishing      * 0.18 +
    shot_power     * 0.10 +
    positioning    * 0.15 +
    heading        * 0.08 +
    sprint_speed   * 0.10 +
    dribbling      * 0.08 +
    short_passing  * 0.08 +
    composure      * 0.08 +
    ball_control   * 0.07 +
    stamina        * 0.04 +
    strength       * 0.04
)

// Goalkeeper OVR calculation (simplified)
ovr_goalkeeper = (
    diving         * 0.21 +
    handling       * 0.21 +
    reflexes       * 0.21 +
    positioning    * 0.21 +
    kicking        * 0.10 +
    speed          * 0.03 +
    reactions      * 0.03
)
```

> 句型解析: "The OVR is calculated using position-specific weights" — "position-specific" 是复合形容词，意为"针对特定位置的"。同一个球员在不同位置的OVR值是不同的。

This means the **same player** can have different OVR values at different positions — a midfielder played as a striker will have a lower OVR because the weight distribution changes.

## 4. Potential and Growth

### Player Potential

Each player has a **potential** (潜力值) rating — the maximum OVR they can reach through development. Young players typically have a gap between current OVR and potential.

```
Example:
  Player: Young Striker, Age 18
  Current OVR: 68
  Potential: 88
  Growth Window: Age 18-27 (peak years)
```

### Growth Curves

Player development follows *characteristic* (特征性的) growth curves:

- **Age 16–21**: Rapid growth, especially with regular playing time
- **Age 22–29**: Peak performance, slow or no growth
- **Age 30–33**: Gradual *decline* (下降), physical attributes drop first
- **Age 34+**: Accelerated decline

```
Rating
  90 ┤                  ╭────────╮
  80 ┤            ╭─────╯        ╰──╮
  70 ┤       ╭────╯                  ╰──╮
  60 ┤  ╭────╯                           ╰──╮
  50 ┤──╯                                    ╰──
     └──┬────┬────┬────┬────┬────┬────┬────┬──
       16   19   22   25   28   31   34   37
                        Age
```

In game code, growth is typically calculated per-attribute with some *randomization* (随机化):

```
function updateAttribute(player, attr, season) {
    age = player.age
    potential_gap = player.potential - player.ovr
    
    if age < 22:
        growth_rate = 0.6 + random(0.0, 0.4)
    elif age < 29:
        growth_rate = 0.1 + random(0.0, 0.1)
    else:
        growth_rate = -0.3 - random(0.0, 0.5)
    
    playing_time_bonus = player.minutes_played / max_minutes * 0.3
    
    attr.value += growth_rate * potential_gap * playing_time_bonus
}
```

## 5. Work Rates and Traits

Beyond numerical attributes, players have *qualitative* (定性的) modifiers:

### Work Rates (跑动积极性)

| Setting | Effect |
| --- | --- |
| High / High | Player runs constantly in attack and defense |
| High / Low | Attacks eagerly but *neglects* (忽视) defensive duties |
| Low / High | Stays back, *reluctant* (不情愿的) to join attacks |
| Low / Low | Minimal off-ball movement — a "lazy" player |

Work rates directly affect AI movement decisions — a high attacking work rate triggers more forward runs.

### Traits (特性)

Traits are boolean *flags* (标记) that unlock special behaviors:

- **Finesse Shot** (巧射): Can perform curled shots into far corners
- **Speed Dribbler** (高速盘带): Maintains speed while dribbling
- **Power Header** (强力头球): Extra force on headed shots
- **Leadership** (领导力): Boosts nearby teammates' composure
- **Injury Prone** (易受伤): Higher chance of getting injured

In code, traits act as **feature flags** that enable or modify specific gameplay behaviors.

## 6. Chemistry and Synergy

Many football games include a **chemistry system** (化学反应系统) that applies bonuses when players have good *synergy* (协同效应):

- **Nationality link**: Players from the same country
- **Club link**: Players from the same club
- **League link**: Players from the same league
- **Position compatibility**: Players in their natural position vs. out of position

Chemistry modifiers typically scale attributes by ±5–10%, affecting how a player performs in-game.

## 7. Data Pipeline

For a production football game, the attribute pipeline looks like:

```
Real-World Scouting Data
        │
        ▼
  Scout Network / Data Partners (e.g., Opta, StatsBomb)
        │
        ▼
  Internal Rating Team (manual review + algorithms)
        │
        ▼
  Player Database (JSON / SQL / proprietary format)
        │
        ▼
  Game Runtime (loaded into memory, queried by AI + physics)
```

Major football games employ *dedicated* (专职的) rating teams of 30+ people who watch real matches and adjust attributes regularly.

## 8. Key Takeaways

- Attributes are the **numerical backbone** of a football game — they drive physics, AI, and animation systems
- OVR is a **weighted summary** that varies by position
- Growth systems simulate player development over *careers* (职业生涯)
- Traits are **feature flags** that toggle special gameplay behaviors
- Chemistry systems add a *meta-layer* (元层) of team-building strategy
