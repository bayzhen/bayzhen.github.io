---
layout: article
title: "Football Rules & Match Structure"
description: "The fundamental rules of football (soccer), match structure, and key referee decisions explained for game developers"
lang: en
level: beginner
tags: ["Football", "Rules", "Fundamentals"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 1
next:
  title: "Player Positions & Roles"
  url: "02-player-positions.html"
---

## 1. What is Football?

Football (also called *soccer* in North America) is the world's most popular sport. Two teams of eleven players each compete to score goals by moving the ball into the opposing team's net. The team with the most goals at the end of the match wins.

For game developers, understanding football's rules is the foundation for building any football game — from realistic *simulations* (模拟游戏) to casual arcade-style experiences.

## 2. The Pitch

A football match is played on a rectangular grass field called the **pitch** (球场). Key *dimensions* (尺寸) and areas include:

- **Length**: 100–110 meters; **Width**: 64–75 meters
- **Center Circle**: A circle with a 9.15m radius at the midpoint
- **Penalty Area** (禁区): A rectangular zone 40.3m wide and 16.5m deep in front of each goal. *Fouls* (犯规) committed by the defending team inside this area result in a **penalty kick** (点球)
- **Goal Area** (球门区): A smaller box 18.3m wide and 5.5m deep, also known as the "six-yard box"
- **Goal**: 7.32m wide and 2.44m high

> 句型解析: "Fouls committed by the defending team inside this area result in a penalty kick" — 过去分词短语 "committed by..." 作后置定语修饰 fouls，意为"由防守方在此区域内犯下的犯规将判罚点球"。

In a game engine, the pitch is typically your primary *terrain* (地形). These exact measurements matter for realistic scaling.

## 3. Match Structure

A standard match has the following time structure:

| Phase | Duration |
| --- | --- |
| First Half | 45 minutes |
| Half-Time Break | 15 minutes |
| Second Half | 45 minutes |
| *Stoppage Time* (补时) | Added by referee |
| Extra Time (if needed) | 2 × 15 minutes |
| Penalty Shootout (if needed) | Best of 5 kicks |

**Stoppage time** (also called *injury time* or *added time*) *compensates* (补偿) for delays such as injuries, substitutions, and time-wasting. The referee decides how many minutes to add.

> 句型解析: "Stoppage time compensates for delays such as injuries, substitutions, and time-wasting" — "compensate for" 是固定搭配，意为"补偿、弥补"；"such as" 后接具体例子。

In game development, you need to decide whether to simulate real-time (90 minutes = 90 real minutes), compressed time (common: 4–10 real minutes per match), or *abstracted* (抽象化的) time.

## 4. Starting and Restarting Play

The match begins with a **kick-off** (开球) at the center spot. Kick-offs also restart play after a goal is scored and at the start of the second half.

Other restarts include:

- **Throw-in** (掷界外球): When the ball crosses the sideline. A player throws the ball in with both hands from behind the head.
- **Goal kick** (球门球): When the attacking team kicks the ball over the goal line (but not into the goal). The defending team restarts from the goal area.
- **Corner kick** (角球): When the defending team kicks the ball over their own goal line. The attacking team kicks from the corner arc.
- **Free kick** (任意球): Awarded after a foul. Can be *direct* (直接任意球, can score directly) or *indirect* (间接任意球, must touch another player first).
- **Penalty kick** (点球): A direct shot from the penalty spot (11m from the goal), awarded for fouls inside the penalty area.

Each of these restarts is a distinct game state that your game engine must handle.

## 5. Scoring

A goal is scored when the **entire ball** crosses the goal line between the goalposts and under the crossbar. This "whole ball" rule is critical:

- The ball must *completely traverse* (完全越过) the goal line
- Modern professional football uses **Goal-Line Technology** (门线技术) to verify this

In game code, this is typically a *collision detection* (碰撞检测) problem: check whether the ball's bounding volume has fully passed the goal-line plane.

## 6. Offside

The **offside** (越位) rule is one of football's most complex rules:

A player is in an offside position if they are nearer to the opponent's goal line than both the ball and the *second-to-last defender* (倒数第二名防守球员) at the moment the ball is played to them.

> 句型解析: "A player is in an offside position if they are nearer to the opponent's goal line than both the ball and the second-to-last defender" — "nearer...than both A and B" 是比较级结构，意为"比A和B都更靠近..."。

Being offside is **not** an offense by itself. It only becomes an offense if the player:

1. *Interferes with play* (干扰比赛) — e.g., plays or touches the ball
2. *Interferes with an opponent* (干扰对方球员) — e.g., blocks the goalkeeper's view
3. *Gains an advantage* (获得利益) from the offside position

For game AI, implementing offside detection requires tracking the positions of all relevant players at the exact frame the ball is passed.

## 7. Fouls and Misconduct

Common fouls include:

- **Tripping** (绊摔) or tackling an opponent carelessly
- **Pushing** (推人) or holding an opponent
- **Handball** (手球): Deliberately touching the ball with hand or arm

The referee can show:

- **Yellow card** (黄牌): A *caution* (警告). Two yellows = one red.
- **Red card** (红牌): The player is *sent off* (罚下) and cannot be replaced. The team plays with fewer players.

In game design, the foul system affects gameplay balance. Most games implement *simplified* (简化的) foul detection based on tackle angle, timing, and contact type.

## 8. Substitutions

Each team can make a limited number of **substitutions** (换人):

- Standard rules allow **5 substitutions** per match (changed from 3 in recent years)
- Substitutions can only happen during *stoppages* (停顿) in play
- A substituted player cannot return to the match

For game developers, substitutions are a key *tactical* (战术的) mechanic — allowing players to bring on fresh legs or change formation mid-match.

## 9. Key Takeaways for Game Developers

| Rule Concept | Game Dev Implication |
| --- | --- |
| Pitch dimensions | World/level geometry, camera boundaries |
| Match timing | Game clock system, time compression |
| Restarts (kick-off, throw-in, etc.) | State machine transitions |
| Goal detection | Physics/collision system |
| Offside | Real-time spatial queries on player positions |
| Fouls & cards | Contact detection, disciplinary system |
| Substitutions | Roster management, tactical UI |

Understanding these rules gives you the *blueprint* (蓝图) for the core systems you will need to build.
