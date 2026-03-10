---
layout: article
title: "Behavior Cloning: Learning from Humans"
description: "How supervised learning on expert replays gives game AI a solid starting point"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 3
prev:
  title: "Integer Quantization to the Rescue"
  url: "02-integer-quantization.html"
next:
  title: "From Imitation to Reinforcement Learning"
  url: "04-reinforcement-learning.html"
---

Before a game AI can learn to win on its own, it first needs to learn what "playing the game" even looks like. Behavior cloning is the simplest way to get there: record what expert human players do, then train a neural network to mimic them. It is supervised learning dressed in a game development costume.

## The Pipeline

The process is straightforward. Human players — often QA testers or skilled employees — play hundreds of matches. Every frame, the system records the game state (positions, velocities, ball location, teammate formations) and the action the player chose (pass, shoot, sprint, tackle). This produces a massive dataset of state-action pairs.

A small MLP takes the state vector as input and outputs a probability distribution over possible actions. Training uses cross-entropy loss, exactly like image classification. The "image" is a vector of game features; the "class" is the chosen action. A few hours of GPU time on a single machine is usually enough.

> **Word Notes**
> - *mimic* /ˈmɪmɪk/ — 模仿。"The AI mimics human decision-making patterns."
> - *cross-entropy loss* — 交叉熵损失。A loss function measuring how well predicted probabilities match the true labels.

## Why It Works (At First)

Behavior cloning produces surprisingly competent AI quickly. The model learns common patterns — when to pass under pressure, how to position during a counterattack, when to switch from offense to defense. For most casual players, a well-trained BC model feels like a reasonable teammate or opponent.

The training infrastructure is simple too. No game simulation needed during training — just load the CSV files and run gradient descent. No reward function to design, no environment to wrap, no distributed training cluster. One data scientist with one GPU can ship a working model in a week.

> **Word Notes**
> - *competent* /ˈkɑːmpɪtənt/ — 称职的，有能力的。"The intern quickly became a competent programmer."
> - *gradient descent* — 梯度下降。The optimization algorithm that adjusts weights to minimize loss.

## The Ceiling

But behavior cloning has a hard ceiling: it can never exceed the skill level of the human experts it learned from. Worse, it struggles with situations that rarely appear in the training data. A BC model trained on normal gameplay may freeze when facing an unusual formation because it has never seen one.

There is also a compounding error problem. At each frame, the model might make a slightly suboptimal decision. Over many frames, these small errors accumulate. The AI drifts into states that no human expert would have reached, and since it has no training data for those states, it makes even worse decisions. This is known as distribution shift — the model encounters inputs that fall outside its training distribution.

> **Word Notes**
> - *distribution shift* — 分布偏移。When real-world inputs differ from training data, degrading model performance.
> - *suboptimal* /sʌbˈɑːptɪməl/ — 次优的。"A suboptimal algorithm still works, just not as well as it could."

## Key Takeaways

- Behavior cloning is supervised learning: state → action, trained on human replays
- Simple infrastructure: no game simulation, no reward engineering, one GPU is enough
- The ceiling is human-level performance, and distribution shift causes degradation over time

*Copying the master is a fine start — but to surpass the master, you need a different teacher.*
