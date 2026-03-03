---
layout: article
title: "Gameplay & Game Mode Design"
description: "Game mode architecture, state machine-driven match flow, round management, and mode-specific mechanics"
lang: en
level: intermediate
tags: ["Gameplay", "Game Modes", "State Machine"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 6
prev:
  title: "UI Framework Design"
  url: "05-ui-framework.html"
next:
  title: "AI System Design"
  url: "07-ai-system.html"
---

## 1. What Makes a Game Mode?

A **game mode** defines the *rules of engagement* (交战规则) — how players win, how rounds flow, and what special mechanics are available. A single shooter can ship with 10+ game modes, each with unique behavior but sharing common *infrastructure* (基础设施).

The challenge is designing a system flexible enough to support wildly different modes (bomb defusal vs. escort vs. hide-and-seek) while *minimizing* (最小化) code duplication.

## 2. Three-Pillar Architecture

Every game mode is built on three *pillars* (支柱):

```
┌────────────────────────────────────────────────────┐
│                 Game Mode                           │
│  (Server-side authority — rules, spawning, flow)    │
├────────────────────────────────────────────────────┤
│                 Game State                          │
│  (Replicated to all clients — scores, round info)  │
├────────────────────────────────────────────────────┤
│                Player State                         │
│  (Per-player data — kills, deaths, role selection)  │
└────────────────────────────────────────────────────┘
```

| Pillar | Runs On | Replicated? | Responsibility |
| --- | --- | --- | --- |
| **Game Mode** | Server only | No | Authoritative rules, player management, round flow |
| **Game State** | Server → All | Yes | Shared match data visible to everyone |
| **Player State** | Server → All | Yes | Individual player statistics and selections |

> 句型解析: "A single shooter can ship with 10+ game modes, each with unique behavior but sharing common infrastructure" — 一款射击游戏可以发布10+种模式，每种模式有独特行为，但共享相同的基础架构。

## 3. Match Flow State Machine

The match lifecycle is driven by a **state machine** that sequences all phases:

```
Role Select → Weapon Select → Role Load → Warmup
     │
     ▼
  Prepare → Fight → Fight End → Game End → Game Over
              │         ▲
              │         │
              └─────────┘  (next round)
```

### Phase Details

| Phase | Duration | Player Can | Description |
| --- | --- | --- | --- |
| Role Select | ~30s | Pick character | Players choose their character/hero |
| Weapon Select | ~15s | Choose loadout | Select primary, secondary, grenades |
| Role Load | Variable | Wait | Assets are loaded for selected characters |
| Warmup | ~15s | Move + shoot | Practice before the match starts |
| Prepare | ~5s | Move only | Freeze time — cannot shoot |
| Fight | Mode-specific | Full control | The active gameplay phase |
| Fight End | ~5s | None | Round result displayed |
| Game End | ~10s | View scoreboard | Match result shown |

### State Properties

Each state carries *metadata* (元数据) that controls game behavior:

```
State Properties:
├── bAllowCrossHair     — should the crosshair be visible?
├── bIgnoreInput        — should player input be blocked?
├── bIgnoreAbilityInput — should ability input be blocked?
├── bAllowScore         — should kills count toward score?
├── bAllowStatistics    — should statistics be tracked?
├── Duration            — how long does this state last?
└── AllowEnd()          — can this state be exited early?
```

### State Query Helpers

Other systems often need to know the current phase:

```
IsPreFightState()   — role select, weapon select, loading
IsFightState()      — active combat
IsGaming()          — any active game state
IsGameEnding()      — fight end, game end, game over
IsRoleSelecting()   — character selection phase
```

## 4. Bomb Defusal Mode

The most *iconic* (标志性的) competitive shooter mode:

### Core Loop

```
Attackers:  Get bomb → Navigate to site → Plant bomb → Defend bomb
Defenders:  Hold sites → Detect attackers → Defuse bomb (if planted)
```

### Round Stages

```
BombStage:
├── PreRound      — buy time, pick loadout
├── BombNotPlanted — round in progress, no bomb planted
├── BombPlanted    — bomb is ticking, defenders must defuse
├── BombExploded   — attackers win the round
└── BombDefused    — defenders win the round
```

### Win Conditions

| Condition | Winner |
| --- | --- |
| Bomb explodes | Attackers |
| Bomb defused | Defenders |
| All attackers *eliminated* (被消灭) | Defenders |
| All defenders eliminated (bomb not planted) | Attackers |
| Time runs out (bomb not planted) | Defenders |

### Economy System

Bomb defusal modes typically include an **economy** — players earn money for kills, round wins, and *consecutive* (连续的) losses. Money is spent on weapons and abilities at the start of each round:

```
Growth Point Sources:
├── Kill reward         — points per elimination
├── Round win bonus     — bonus for winning team
├── Losing streak bonus — increasing bonus for consecutive losses
│                        (prevents runaway victories)
├── Objective bonus     — planting/defusing the bomb
└── Assist reward       — points for damage assists
```

## 5. Escort / Payload Mode

The team must push a vehicle along a path:

### Path System

```
Payload Path:
├── Path Points          — waypoints defining the route
├── Checkpoints          — progress milestones (unlock time bonuses)
├── Current Distance     — how far the payload has traveled
├── Total Length          — full path distance
└── Overlap Detection    — which players are near the payload
```

### Push Rules

- The payload moves when **attackers** are near it and no **defenders** are nearby
- More attackers nearby = faster push (up to a cap)
- If no one is near, the payload *gradually* (逐渐地) rolls backward
- Reaching a checkpoint locks progress — the payload cannot roll back past it

### Overtime

If attackers are on the payload when time runs out, the game enters *overtime* (加时赛) — the clock keeps ticking as long as the attackers maintain *contest* (争夺).

## 6. Hide & Seek Mode

An *asymmetric* (非对称的) mode where one team hides and the other seeks:

### Phase System

```
Phase 1:
├── Hiders have a head start to hide
├── Seekers are locked in spawn
└── Duration: ~30 seconds

Phase 2 (Main):
├── Seekers hunt for hiders
├── Caught hiders become seekers
├── Duration: ~3 minutes
└── Hiders win if any survive

Phase 3 (Showdown — optional):
├── Remaining hiders revealed
├── Final confrontation
└── Short duration
```

### Role Transitions

```
Events:
├── BecomeSeeker      — assigned to seeking team
├── BecomeHider       — assigned to hiding team
├── HiderBecomeSeeker — caught hider switches sides
├── KillHider         — seeker eliminates a hider
└── PhaseTwoComing    — warning before showdown
```

## 7. Team Deathmatch

The simplest competitive mode — two teams fight for kills:

### Scoring

- Each kill scores one point for the team
- First team to reach the **score limit** wins
- If time runs out, the team with more kills wins

### Multi-Kill Rewards

```
Consecutive Kill Rewards:
├── Double Kill (2 rapid kills) — bonus grenade
├── Triple Kill (3 rapid kills) — bonus grenade + announcement
├── Quad Kill  (4 rapid kills) — team-wide announcement
└── Ace        (team wipe)     — special visual effect
```

## 8. Other Mode Patterns

Several other modes follow *recurring* (反复出现的) patterns:

### Resource Collection (Mining Mode)

- Teams collect resources from spawn points on the map
- Resources must be *deposited* (存放) at a base
- Stealing from the enemy base is possible
- First team to reach the resource target wins

### Area Control (Splatoon / Hot Zone)

- Teams compete to control map zones
- Control is measured by occupancy or "painted" area
- Zones may shift during the match

### Infection / Zombie

- One team is "infected" and tries to convert the other team
- Last survivor(s) win
- Infected players gain special abilities

## 9. Player Lifecycle in a Game Mode

The Game Mode manages the full player lifecycle:

```
PreLogin()     — validate the player before joining
Login()        — create the player controller
PostLogin()    — initialize player data, assign team
    │
SetPlayerInfo() — configure character, weapon loadout
ChooseTeam()    — assign to a balanced team
ChooseSpawn()   — find a valid spawn point
    │
Respawn Cycle:
├── CanRestartPlayer() — check if respawn is allowed
├── SetRespawnDelay()  — configure respawn timer
├── RestartPlayer()    — spawn character, set defaults
└── OnRoundEnd()       — cleanup, prepare for next round
    │
Logout()       — player disconnects, cleanup
```

### Damage and Death

```
ModifyDamage()        — apply mode-specific damage rules
│                      (e.g., friendly fire on/off)
CanDealDamage()       — check if damage is allowed in current state
HandleDamageStats()   — record damage for scoreboard
│
AfterInjured()        — player is knocked down (if applicable)
AfterDeath()          — player is eliminated
HandleDeathStats()    — update kill/death/assist counters
```

## 10. Key Takeaways

- Game modes are built on **three pillars**: Game Mode (rules), Game State (shared data), Player State (individual data)
- A **state machine** drives the match lifecycle through phases: select → prepare → fight → end
- Each state carries **metadata** that controls input, scoring, and UI behavior
- **Bomb defusal** is the most complex mode, with economy, objective, and asymmetric win conditions
- **Escort mode** uses a path-based system with checkpoints, overtime, and contest detection
- **Hide & seek** demonstrates phase-based asymmetric gameplay with role transitions
- The player lifecycle is managed by the Game Mode from **login to logout**, including team assignment, spawning, and respawning
