---
layout: article
title: "Rollback Netcode"
description: "Rewind time, fix the past, replay the present — the fighting game community's answer to online lag"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "Rollback", "Fighting Games", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 4
prev:
  title: "Client-Side Prediction"
  url: "03-client-prediction.html"
next:
  title: "State Synchronization"
  url: "05-state-sync.html"
---

In 2019, a professional fighting game player missed a tournament-winning combo. His inputs were perfect. The problem was 4 frames of artificial delay — roughly 67 milliseconds — inserted by the game's netcode. That tiny gap turned a flawless combo into a dropped one. The fighting game community had endured this pain for years. Then rollback netcode changed everything.

## The Problem with Delay-Based Netcode

Traditional online fighting games use delay-based netcode. Before executing your input, the game waits until it receives your opponent's input for that same frame. If the round-trip latency is 100ms, the game adds about 3 frames of input delay. At 150ms, it becomes 5 frames.

For most game genres, a few extra frames go unnoticed. But fighting games demand precision. A dragon punch combo in Street Fighter requires inputs within a 2-frame window. Add 4 frames of delay and the timing feels completely foreign. Muscle memory — built over thousands of hours — stops working.

> **Word Notes**
> - *endure* /ɪnˈdjʊr/ — 忍受，忍耐。"Players endured years of laggy online matches."
> - *precision* /prɪˈsɪʒən/ — 精确，精准。"Fighting games demand frame-level precision from players."

## How Rollback Works

Rollback takes a radically different approach. Instead of waiting, each client predicts the opponent's input — usually by repeating their last known input. The game runs immediately with zero added delay. Your button press registers on screen in exactly 1 frame, just like offline play.

But predictions can be wrong. When the real input arrives and differs from the prediction, the game must fix its mistake. Here is the process:

1. **Save state** every frame — a full snapshot of positions, health bars, hitboxes, and animations.
2. **Run the game** using the predicted input with no delay.
3. **Receive the real input** a few frames later.
4. If the prediction was wrong, **rewind** the game state to the frame where the mismatch occurred.
5. **Replay** all frames from that point forward with the correct inputs, catching up to the present in a single render tick.

Steps 4 and 5 happen invisibly within one frame. The player sees a brief visual glitch — a character might teleport a few pixels — but their own inputs always feel instant.

> **Word Notes**
> - *snapshot* /ˈsnæpʃɑːt/ — 快照。"The engine saves a snapshot of the game state each frame."
> - *mismatch* /ˈmɪsmætʃ/ — 不匹配。"A mismatch between predicted and actual input triggers a rollback."

## GGPO: The Pioneer

In 2006, a developer named Tony Cannon created GGPO (Good Game Peace Out), a middleware library that implemented rollback for fighting games. GGPO handled the hard parts: state saving, input prediction, and the rewind-replay loop. Game developers only needed to provide two callbacks — one to save the game state and one to load it.

GGPO was open-sourced in 2019. Its ideas spread rapidly. Arc System Works adopted rollback for Guilty Gear Strive in 2021. Capcom built it into Street Fighter 6 in 2023. Players praised both games for online play that felt nearly identical to sitting next to your opponent.

## The Determinism Requirement

Rollback demands one strict rule: the simulation must be deterministic. Given the same inputs on the same frame, the game must produce the exact same result on both machines. If player A's simulation drifts even slightly from player B's, the rollback corrections will produce different outcomes. The game will desync.

This means no random floating-point behavior. No uninitialized variables. No frame-rate-dependent physics. Every calculation must produce identical results on every machine, every time.

> **Word Notes**
> - *deterministic* /dɪˌtɜːrmɪˈnɪstɪk/ — 确定性的。"A deterministic function always returns the same output for the same input."
> - *desync* /diːˈsɪŋk/ — 不同步。"Floating-point errors can cause the two clients to desync."

## Why 1v1 Games Are the Sweet Spot

Rollback shines in 1v1 fighting games for a practical reason: small game state. A fighting game's state — two characters, a few hitboxes, some timers — might be only 2-4 kilobytes. Saving and loading that state 60 times per second is trivial.

Now imagine a 64-player battle royale. The game state could be several megabytes. Saving and restoring it every frame becomes expensive. Rewinding and replaying 5 frames means running the entire simulation 5 extra times in a single frame. The CPU cost scales with both state size and player count. This is why large-scale games typically use other synchronization strategies.

*Rollback netcode does not hide latency — it lets you act as if latency does not exist, then quietly corrects the timeline behind your back.*
