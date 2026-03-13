---
layout: article
title: "A Football Pitch on Your GPU"
description: "How RL Learner simulates thousands of 11v11 football matches in parallel using CUDA tensors"
level: intermediate
tags: ["RL Learner", "English", "Reading"]
series: rl-learner
series_title: "RL Learner: English Reading"
order: 3
prev:
  title: "PPO and GAE: The Engine Room"
  url: "02-ppo-gae.html"
next:
  title: "The Optimization Sprint: 7K to 1.2M SPS"
  url: "04-performance.html"
---

Imagine running 16,000 football matches at the same time, each with 22 players chasing a ball. Now imagine all of that happening inside a single GPU. That is what the football environment in RL Learner does.

## Everything is a Tensor

Traditional game environments loop over each player, each collision, each physics update one at a time. That approach collapses when you need millions of steps per second. Instead, RL Learner represents the entire game state as GPU tensors. Player positions, velocities, ball state, scores — all stored as batched tensors of shape (num_envs, 22, 2). Every physics operation is a single vectorized call across all environments simultaneously.

> **Word Notes**
> - *tensor* /ˈtensə/ — 张量。A multi-dimensional array, the fundamental data structure of GPU computing.
> - *simultaneously* /ˌsɪməlˈteɪniəsli/ — 同时地。All 16,000 matches update in the same GPU kernel call.

## The Branchless Rule

The environment has a strict rule: no `.item()` calls, no `.any()` checks, no Python-level conditionals on GPU data during a step. Every piece of logic — ball possession transfer, goal detection, out-of-bounds resets — is written as branchless tensor arithmetic. For example, instead of writing `if player_has_ball: do_something()`, the code multiplies by a mask: `result = action * has_ball_mask`. This avoids CUDA synchronization stalls that would kill throughput.

> **Word Notes**
> - *branchless* — 无分支的。Code that avoids if-else logic to prevent GPU pipeline stalls.
> - *throughput* /ˈθruːpʊt/ — 吞吐量。The number of samples processed per unit of time.

## Observations and Actions

Each player sees the world from its own perspective. The observation is ego-centric: relative positions of teammates, opponents, and the ball, encoded into a 106-dimensional vector. Frame stacking captures motion — four consecutive frames are concatenated, giving the network temporal information without recurrence.

Actions are simple: 8 directional movements, short pass, long pass, shoot, and no-op. Twelve discrete choices. Players without the ball have their pass and shoot actions masked out by setting those logits to negative infinity.

## Team B: The Rule-Based Opponent

Team A learns through PPO. Team B follows hardcoded rules — chase the ball, push forward when in possession, and mark the nearest opponent when defending. Some randomness is injected to prevent the RL agent from memorizing a single pattern. This asymmetry is intentional: the RL agent needs a stable sparring partner that is good enough to provide challenge but predictable enough to learn against.

> **Word Notes**
> - *sparring partner* — 陪练对手。An opponent used specifically for training purposes.
> - *asymmetry* /eɪˈsɪmətri/ — 不对称性。One team learns while the other follows fixed rules.

## Key Takeaways

- All game state lives on the GPU as batched tensors — no per-player loops
- Branchless tensor arithmetic prevents CUDA sync stalls
- Ego-centric observations with frame stacking give each player a local view
- Rule-based opponents provide a stable training signal

*The pitch is built. Sixteen thousand matches are running. Now the agent just needs to figure out what football actually is.*
