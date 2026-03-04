---
layout: article
title: "Player Attributes & Rating Systems"
description: "How numbers define players in football games — from FIFA's OVR to Football Manager's hidden attributes"
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

## The Problem with Real Football

In real football, you can't measure a player's ability with a single number. Is Messi better than Van Dijk? Depends on what you need — goals or defense.

But in games, we need numbers. The physics engine needs to know how fast a player runs. The AI needs to know who to pass to. The UI needs to show the user who's "better."

So we quantify everything. Welcome to the attribute system.

## The Core Concept

Every player in a football game is defined by **numerical attributes** (数值属性) — typically 20-40 different stats ranging from 1-99. These numbers drive:

- **Physics**: Sprint speed → locomotion system
- **AI**: Vision → passing target selection
- **Animation**: Agility → turning speed
- **Outcomes**: Finishing → shot accuracy

Attributes are the bridge between your database and your game engine.

## FIFA's Attribute System

FIFA uses ~35 attributes organized into 6 categories. Let's break them down:

### Pace (速度)

| Attribute | What It Does |
|-----------|--------------|
| Acceleration | 0 to top speed — how quickly |
| Sprint Speed | Maximum velocity |

A player with 99 acceleration but 70 sprint speed (like Messi) reaches top speed instantly but gets caught by faster players over distance. A player with 70 acceleration but 99 sprint speed (like Adama Traoré) takes time to get going but becomes unstoppable.

### Shooting (射门)

| Attribute | What It Does |
|-----------|--------------|
| Finishing | Accuracy inside the box |
| Shot Power | How hard the ball is struck |
| Long Shots | Accuracy from outside the box |
| Volleys | Striking the ball mid-air |
| Penalties | Composure (沉着) during penalties |

High finishing doesn't guarantee goals — it reduces the error cone. A 99 finishing player can still miss if you aim poorly or shoot under pressure.

### Passing (传球)

| Attribute | What It Does |
|-----------|--------------|
| Vision | AI's ability to "see" passing options |
| Crossing | Accuracy from wide positions |
| Short Passing | Ground passes, short distance |
| Long Passing | Aerial passes, long distance |
| Curve | Ability to bend the ball |

**Vision is fascinating** from a game dev perspective. It doesn't affect pass accuracy — it affects how many passing options the AI considers. A player with 50 vision might only evaluate the 3 nearest teammates. A player with 99 vision evaluates 8+ options, including creative through balls.

### Dribbling (盘带)

| Attribute | What It Does |
|-----------|--------------|
| Agility | Turning speed with the ball |
| Balance | Resistance to physical challenges |
| Ball Control | First touch quality |
| Dribbling | Close control while moving |
| Composure | Performance under pressure |

Composure is a hidden multiplier. When a player is under pressure (defenders nearby, high-stakes situation), composure reduces the penalty to other attributes.

### Defending (防守)

| Attribute | What It Does |
|-----------|--------------|
| Interceptions | Reading and cutting out passes |
| Heading Accuracy | Winning aerial duels (空中球) |
| Marking | Staying close to opponents |
| Standing Tackle | Winning the ball on feet |
| Sliding Tackle | Winning the ball with a slide |

### Physical (身体)

| Attribute | What It Does |
|-----------|--------------|
| Jumping | Vertical leap height |
| Stamina | Endurance (耐力) over 90 minutes |
| Strength | Holding off opponents |
| Aggression | Intensity of challenges |

Stamina is dynamic — it depletes during the match. When stamina drops below 30%, other attes are penalized. A 90-pace player at 20% stamina might only run at 75 pace.

## Overall Rating (OVR) — The Big Lie

FIFA shows every player an **Overall Rating** (OVR) — a single number from 1-99. Ronaldo is 91. Your created player starts at 65.

But here's the trick: **OVR is not an average**. It's a weighted calculation that changes based on position.

### Position-Specific Weights

```python
# Striker OVR (simplified)
ovr_striker = (
    finishing      * 0.18 +
    positioning    * 0.15 +
    shot_power     * 0.10 +
    sprint_speed   * 0.10 +
    heading         +
    dribbling      * 0.08 +
    short_passing  * 0.08 +
    composure      * 0.08 +
    # ... other attributes with smaller weights
)

# Goalkeeper OVR (completely different)
ovr_goalkeeper = (
    diving         * 0.21 +
    handling       * 0.21 +
    reflexes       * 0.21 +
    positioning    * 0.21 +
    kicking        * 0.10 +
    # pace barely matters
)
```

This means:
- The same player has different OVRs at different positions
- A 75 OVR midfielder might be a 68 OVR striker
- OVR is a UI convenience, not a gameplay value

**In your code, never use OVR for calculations.** Use the specific attributes.

## Growth and Potential

### Player Potential (潜力值)

Young players have a **potential** rating — the maximum OVR they can reach. This creates the career mode fantasy: sign an 18-year-old with 68 OVR but 88 potential, develop them, and they become a star.

```
Player: Young Winger, Age 18
Current OVR: 68
Potential: 88
Growth Window: Age 18-27
```

### Growth Curves

Player ratings follow predictable curves:

```
OVR
 90 ┤                  ╭────────╮
 80 ┤            ╭─────╯        ╰──╮
 70 ┤       ╭────╯                  ╰──╮
 60 ┤  ╭────╯                           ╰──╮
 50 ┤──╯                                    ╰──
    └──┬────┬────┬────┬────┬────┬────┬────┬──
      16   19   22   25   28   31   34   37
                       Age
```

- **16-21**: Rapid growth (especially with playing time)
- **22-29**: Peak years, minimal growth
- **30-33**: Gradual decline (physical attributes drop first)
- **34+**: Accelerated decline

### Growth Implementation

```python
def update_attribute(player, attr, season):
    age = player.age
    potential_gap = player.potential - player.ovr

    # Age-based growth rate
    if age < 22:
        growth_rate = 0.6 + random(0.0, 0.4)
    elif age < 29:
        growth_rate = 0.1 + random(0.0, 0.1)
    else:
        growth_rate = -0.3 - random(0.0, 0.5)  # decline

    # Playing time bonus
    playing_time_bonus = player.minutes_played / max_minutes * 0.3

    # Apply growth
    attr.value += growth_rate * potential_gap * playing_time_bonus
```

## Work Rates and Traits

Beyond numbers, players have qualitative modifiers:

### Work Rates (跑动积极性)

| Setting | Behavior |
|---------|----------|
| High / High | Runs constantly in attack and nse |
| High / Low | Attacks eagerly, neglects (忽视) defense |
| Low / High | Stays back, rarely joins attacks |
| Low / Low | Minimal movement — "lazy" player |

Work rates directly affect AI movement. A high attacking work rate triggers more forward runs.

### Traits (特性)

Traits are boolean flags that unlock special behaviors:

- **Finesse Shot** (巧射): Can curl shots into corners
- **Speed Dribbler**: Maintains pace while dribbling
- **Power Header**: Extra force on headers
- **Leadership**: Boosts nearby teammates' composure
- **Injury Prone** (易受伤): Higher injury chance

In code, traits are feature flags:

```cpp
if (player.has_trait(FINESSE_SHOT) && input.is_modified_shot()) {
    shot.apply_curve_bonus(1.5);
    shot.reduce_power(0.8);
}
```

## Football Manager's Hidden Attributes

Football Manager takes attributes to the extreme — **~50 attributes per player**, many hidden from the player.

### Hidden Attributes

- **Consistency** (稳定性): How often a player performs at their peak
- **Important Matches**: Performance boost in big games
- **Injury Proneness**: Likelihood of getting injured
- **Dirtiness**: Tendency to commit fo**Controversy**: Likelihood of -field issues

These create emergent narratives. A player with high ability but low consistency is frustrating — brilliant one match, invisible the next.

## Chemistry Systems

Many games add a **chemistry system** (化学反应系统) — bonuses when players have good synergy:

- **Nationality link**: Same country
- **Club link**: Same club
- **League link**: Same league
- **Position compatibility**: Natural position vs. out of position

Chemistry typically scales attributes by ±5-10%. A player with 85 pace and full chemistry might perform at 90 pace.

## The Data Pipeline

For a production football game:

```
Real-World Scouting Data
        │
        ▼
Data Partners (Opta, StatsBomb)
        │
        ▼
Internal Rating Team (30+ people watching matches)
        │
        ▼
Player Database (JSON / SQL)
        │
        ▼
Game Runtime (loaded into memory)
```

FIFA and PES employ dedicated rating teams who watch real matches and adjust attributes weekly during the season.

## Key Takeaways

- Attributes are the **numerical backbone** of your game — they connect design to engineering
- **OVR is a UI convenience**, not a gameplay value — alwae specific attributes in code
- **Growth systems** simulate player development over careers, creating long-term engagement
- **Traits are feature flags** that toggle special behaviors
- **Hidden attributes** (like consistency) create emergent narratives and realism
- Real games employ **rating teams** who continuously update player data

## Next Up

Now that you understand how players are defined, let's see how they actually play in [Match Mechanics & Gameplay Systems](06-match-mechanics.html).
