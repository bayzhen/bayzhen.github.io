---
layout: article
title: "Football Game UI/UX Conventions"
description: "Standard UI elements, HUD design, menu flows, and UX patterns in football games"
lang: en
level: intermediate
tags: ["UI", "UX", "Design"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 10
prev:
  title: "Ball Physics & Player Movement"
  url: "09-ball-physics.html"
next:
  title: "Football & Football Game Glossary"
  url: "11-glossary.html"
---

## 1. Introduction

Football game UI must serve two *contradictory* (矛盾的) goals: provide rich information without *cluttering* (使杂乱) the screen during fast-paced gameplay. The best football game UIs are *invisible* during play and *informative* during pauses.

This article covers the standard UI/UX conventions that players expect from a football game.

## 2. Match HUD (Heads-Up Display)

The **HUD** (抬头显示) is the *overlay* (叠加层) shown during gameplay. It must be minimal yet informative.

### 2.1 Standard HUD Elements

```
┌─────────────────────────────────────────────────────────┐
│  HOME 2        45:32        1 AWAY                      │  ← Scoreboard
│  ████████░░                  ░░████████                  │  ← Possession bar
│                                                         │
│                                                         │
│                  (gameplay area)                         │
│                                                         │
│                                                         │
│  ┌──────┐                                  [Radar]      │
│  │Player│  Stamina: ████░░                              │
│  │ Name │  Sprint available                             │
│  └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

**Top bar** — always visible:
- Team names and *crests* (队徽)
- Score
- Match clock (with stoppage time indicator)

**Bottom left** — context-dependent:
- Currently controlled player name and number
- Stamina bar
- Sprint / special move *availability* (可用性)

**Bottom right** — mini-map / radar:
- Shows all 22 players as colored dots
- Ball position highlighted
- Helps with *spatial awareness* (空间感知)

### 2.2 Radar / Mini-Map

The **radar** is one of the most *utilitarian* (实用的) UI elements. It shows a top-down view of the entire pitch:

```
┌───────────────────┐
│  ·  ·    ○    ·   │   ○ = ball
│    ·   ·      ·   │   · = player (team color)
│  ·       ·  ·     │   ● = controlled player
│    ·  ●     ·     │
│  ·    ·    ·   ·  │
└───────────────────┘
```

Design considerations:
- Fixed or rotated (rotated follows camera *orientation* (朝向))
- Size: large enough to be useful, small enough not to distract
- Player dots: your team in one color, opponents in another
- The controlled player should be visually *distinct* (醒目的)

### 2.3 Contextual Indicators

During gameplay, additional indicators appear *temporarily* (临时地):

- **Player switching indicator**: Arrow pointing to the next player you'll control
- **Pass power bar**: Shows charge level during a pass
- **Shot indicator**: Aim *reticle* (准星) and power bar during shots
- **Offside line**: Visual guide showing the offside boundary
- **Sprint trail**: Visual effect showing a player is sprinting

## 3. Scoreboard and Statistics

### 3.1 In-Match Statistics Overlay

Accessible via pause or a quick-view button:

| Statistic | Home | Away |
| --- | --- | --- |
| Possession | 58% | 42% |
| Shots | 8 | 5 |
| Shots on Target | 4 | 2 |
| Passes | 342 | 267 |
| Pass Accuracy | 87% | 79% |
| Fouls | 6 | 9 |
| Corners | 4 | 2 |
| Yellow Cards | 1 | 2 |

### 3.2 Post-Match Summary

After the match, a comprehensive *breakdown* (详细分析) is shown:

- Match result with goal scorers and times
- Player ratings (1–10 scale)
- Best player award — *Man of the Match* (全场最佳)
- Heat maps showing player movement
- Key *highlights* (精彩时刻) with replay options

## 4. Menu Structure

Football games have a deep menu *hierarchy* (层级结构):

```
Main Menu
├── Play
│   ├── Quick Match
│   ├── Online Match
│   ├── Tournament
│   └── Training / Tutorial
├── Career Mode
│   ├── Squad Management
│   │   ├── Lineup (首发阵容)
│   │   ├── Formation & Tactics
│   │   ├── Training Schedule
│   │   └── Transfers (转会)
│   ├── Calendar
│   ├── Finances
│   └── Staff
├── Ultimate Team / Card Mode
│   ├── My Team
│   ├── Store / Market
│   ├── Challenges
│   └── Rewards
├── Customization
│   ├── Controls
│   ├── Camera Settings
│   ├── Visual Settings
│   └── Audio Settings
└── Profile / Statistics
```

### Navigation Principles

- **Breadth over depth**: Prefer more top-level options over deep nesting
- **Quick access**: The most common action (start a match) should be reachable in 2 clicks
- **Context persistence**: When returning from a match, the user should return to where they were in the menu
- **Loading screens**: Use them to show *tips* (提示), player spotlights, or match previews

## 5. Team Selection Screen

The **team selection** screen is a critical *first impression* (第一印象):

```
┌─────────────────────────────────────────────────────────┐
│                  TEAM SELECTION                          │
│                                                         │
│  ┌─────────────┐         ┌─────────────┐               │
│  │  [Team Logo] │         │  [Team Logo] │               │
│  │  Team Name   │  VS     │  Team Name   │               │
│  │  ★★★★☆      │         │  ★★★☆☆      │               │
│  │  League Name │         │  League Name │               │
│  └─────────────┘         └─────────────┘               │
│                                                         │
│  Kit: [Home] [Away] [Third]                             │
│  Formation: 4-3-3                                       │
│                                                         │
│  Search: [____________] Filter: [League ▼] [Nation ▼]   │
│                                                         │
│  [Ready]                              [Back]            │
└─────────────────────────────────────────────────────────┘
```

Key UX considerations:
- Star ratings for quick team strength *assessment* (评估)
- Kit selection to avoid color *clashes* (冲突)
- Fast search and filter for large team databases
- Formation preview before starting the match

## 6. Pre-Match Screen

Before kick-off, players see:

- **Stadium preview**: 3D view of the venue with weather and time of day
- **Lineup comparison**: Side-by-side team sheets
- **Head-to-head stats**: Historical record between the teams
- **Formation overview**: Tactical setup visualization
- **Commentary intro**: Commentators introduce the match

This screen sets the *atmosphere* (氛围) — it is the *cinematic* (电影式的) bridge between menus and gameplay.

## 7. Tactical Setup UI

The formation and tactics screen is one of the most complex UIs:

### Formation Editor

- **Pitch view**: Top-down view of the pitch with *draggable* (可拖动的) player icons
- **Position snapping**: Players snap to valid positions when dragged
- **Role assignment**: Click a player to change their tactical role
- **Instruction cards**: Per-player instructions (stay back, get forward, cut inside)

### Tactical Sliders

```
Pressing Height:    [■■■■■■░░░░] 60%
Defensive Width:    [■■■■░░░░░░] 40%
Attacking Width:    [■■■■■■■░░░] 70%
Build-Up Speed:     [■■■■■░░░░░] 50%
```

These sliders directly map to AI parameters (as discussed in the AI Design article).

## 8. Player Card / Profile UI

Individual player screens display:

```
┌─────────────────────────────┐
│  [Player Photo]              │
│  Name: L. Messi              │
│  Position: RW  |  Age: 38    │
│  OVR: 88  |  POT: 88        │
│                              │
│  PAC 72  │███░░░│            │
│  SHO 85  │████░░│            │
│  PAS 88  │█████░│            │
│  DRI 90  │█████░│            │
│  DEF 34  │█░░░░░│            │
│  PHY 64  │██░░░░│            │
│                              │
│  Traits: Finesse Shot,       │
│          Playmaker, Outside  │
│          Foot Shot            │
│                              │
│  Work Rate: M / L            │
│  Weak Foot: ★★★★☆           │
│  Skill Moves: ★★★★☆         │
└─────────────────────────────┘
```

The **bar chart** visualization is *ubiquitous* (无处不在的) in football games — it provides instant *at-a-glance* (一目了然的) attribute comparison.

> 句型解析: "ubiquitous" 是一个较难的词，意为"无处不在的、普遍存在的"。"at-a-glance" 是复合形容词，意为"一看就懂的"。

## 9. Accessibility Considerations

Modern football games should include *accessibility* (无障碍) features:

- **Color-blind modes**: Alternative color schemes for team *differentiation* (区分)
- **Subtitle options**: Commentary subtitles with size and background options
- **Button remapping**: Fully customizable controls
- **Difficulty assist**: AI assistance levels for new players
- **Visual cues**: Audio cues supplemented with visual *indicators* (指示器) for hearing-impaired players

## 10. Key Takeaways

- The match HUD must be **minimal** during play and **rich** during pauses
- The **radar/mini-map** is essential for spatial awareness — it's the player's strategic overview
- Menu structure should prioritize **quick access** to the most common actions
- The tactical UI must make complex settings **visually intuitive** through pitch views and sliders
- Player card UIs use **bar charts** as the standard visualization for attribute comparison
- **Accessibility** is not optional — color-blind modes and customizable controls are expected
