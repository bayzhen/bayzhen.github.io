---
layout: series-index
title: "Neural Networks in Frame-Sync Games: English Reading"
description: "Why multiplayer games need deterministic AI, integer quantization, behavior cloning, and the road to reinforcement learning"
series_id: nn-frame-sync
lang: en
---

## About This Series

Competitive multiplayer games like football or basketball simulators often use **frame synchronization** — every client runs the same game logic and must produce identical results. But what happens when you add neural networks to the mix? Floating-point math behaves differently across devices, threatening to break the entire sync mechanism. This series explores how game studios solve this problem and push AI from simple imitation toward true learning.

## What You'll Find

- Why frame-sync games demand perfectly deterministic AI inference
- How integer quantization eliminates floating-point inconsistency
- Teaching AI to play through behavior cloning (supervised learning)
- The journey from imitation learning to reinforcement learning with PPO and self-play
- Real-world engineering trade-offs when deploying ML models in live games

## How to Use This Series

Each article is 300–500 words — short enough to copy out by hand in one sitting. Difficult words are annotated inline. Read straight through, or jump to any article that interests you.

Start with [The Determinism Problem](01-determinism-problem.html).
