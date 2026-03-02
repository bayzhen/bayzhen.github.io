---
layout: article
title: "MBRL核心框架"
description: "Model-Based Reinforcement Learning核心框架，包括Dyna循环、核心公式与权衡分析"
level: intermediate
tags: ["Dyna", "框架", "MBRL"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 1
next:
  title: "世界模型设计"
  url: "/articles/mbrl-study-notes/02-world-model-formulations.html"
---

## 核心直觉

Model-based RL learns a predictive world surrogate so policy improvement can reuse data through imagination instead of paying full simulator cost for every gradient step.

## Dyna循环

The Dyna loop alternates between real interaction, model fitting, and policy learning. Real transitions ground the agent in reality. Model rollouts expand coverage beyond collected trajectories. Policy updates consume both data streams, with real data acting as anchor and imagined data acting as accelerator.

A clean decomposition is model-learning versus policy-learning. Model-learning minimizes predictive error under replay distribution. Policy-learning maximizes expected return under the policy-induced state distribution. These distributions are different, which is why model bias appears under policy improvement.

## 核心公式

\[\hat{p}\_\theta(s\_{t+1}, r\_t, c\_t \mid s\_t, a\_t)\]

\[\pi^\* = \arg\max\_\pi \mathbb{E}\_{\tau \sim (\pi, M)}\left[\sum\_t \gamma^t r\_t\right]\]

\[\tau\_{\text{train}} \sim \alpha\,\mathcal{D}\_{\text{real}} + (1-\alpha)\,\mathcal{D}\_{\text{model}}\]

## 何时使用学习模型

Use a learned model when real simulation is expensive, slow, unsafe, or unavailable at scale. Use a real simulator directly when it is cheap and exact enough, because simulator rollouts have no learned-model bias. In practice, most strong systems are hybrid: real data for correction, model data for speed.

## 核心权衡

The core tradeoff is sample efficiency versus bias. Model-free methods usually have lower model bias but poor data efficiency. MBRL improves data efficiency by reusing dynamics structure, but long imagination horizons can amplify errors and produce unrealistic high-value artifacts.

**游戏AI实践洞察：**Deploy a Dyna-style cadence with conservative imagination horizon at first, then increase model usage only when validation error and policy realism metrics are stable.
