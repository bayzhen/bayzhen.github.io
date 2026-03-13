---
layout: article
title: "Meet RL Learner: An AI-Built AI Trainer"
description: "An overview of RL Learner — a reinforcement learning system generated almost entirely by AI"
level: intermediate
tags: ["RL Learner", "English", "Reading"]
series: rl-learner
series_title: "RL Learner: English Reading"
order: 1
next:
  title: "PPO and GAE: The Engine Room"
  url: "02-ppo-gae.html"
---

What happens when you ask an AI to build another AI? You get RL Learner — a reinforcement learning training system that was coded almost entirely through conversation with Claude Code.

## The Project at a Glance

RL Learner trains game-playing agents using Proximal Policy Optimization (PPO). The system follows a Centralized Training, Decentralized Execution (CTDE) architecture: all 11 players on a football team share the same neural network weights during training, but each player acts independently based on its own observations at runtime.

> **Word Notes**
> - *proximal* /ˈprɒksɪməl/ — 近端的，邻近的。In PPO, it means the new policy stays "close" to the old one.
> - *decentralized* /diːˈsentrəlaɪzd/ — 去中心化的。Each agent makes decisions on its own.

## Two Training Paths

The system has two distinct modes. The first is a worker mode: remote game clients send experience data over ZeroMQ to a central learner that runs PPO updates. This is the distributed path for real game integration. The second is a self-contained GPU mode: a CUDA-vectorized football environment runs thousands of parallel matches entirely on the GPU, collecting experience without any network overhead.

The clever part is that both paths feed into the same PPO core. The algorithm does not care where the data comes from.

## AI Writing AI

Here is the surprising thing: the entire codebase — the environment, the network, the buffer, the reward system — was generated through iterative prompting. A human guided the architecture decisions, but the AI wrote every line. This creates an interesting dynamic. The code is clean, well-structured, and thoroughly tested. But when training fails on a hard problem like 11v11 football, diagnosing the issue requires deep understanding that the AI alone cannot provide.

> **Word Notes**
> - *iterative* /ˈɪtərətɪv/ — 迭代的，反复的。Building something through repeated cycles of refinement.
> - *diagnose* /ˌdaɪəɡˈnəʊz/ — 诊断。Identifying the root cause of a problem.

## What Works and What Does Not

Simple environments converge beautifully. A chase-the-target task — where a single agent learns to walk toward a goal — solves itself within minutes. But scale that to 22 players on a football pitch with passing, shooting, and positioning, and the agent stares blankly at the ball. The gap between "works on a toy problem" and "works on the real thing" is the central challenge of this project.

## Key Takeaways

- RL Learner uses PPO with shared weights across all 11 players (CTDE)
- Two data paths (distributed workers and GPU self-play) feed the same training core
- AI-generated code is clean and functional, but hard problems still need human insight

*The tools are ready. The question is whether we can ask the right questions.*
