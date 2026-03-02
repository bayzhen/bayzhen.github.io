---
layout: article
title: "多智能体考量"
description: "多智能体MBRL中的非平稳动力学、对手建模、基于种群的训练与自博弈过拟合问题"
level: advanced
tags: ["多智能体", "自博弈"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 10
prev:
  title: "好奇心与主动数据收集"
  url: "/articles/mbrl-study-notes/09-curiosity-and-active-collection.html"
---

## 核心直觉

In multi-agent RL, the world model must absorb opponent adaptation, so transition dynamics are nonstationary from each agent's perspective.

## 非平稳动力学

If opponents learn, then transition probabilities drift over training. A single-agent model \(p(s\_{t+1}\mid s\_t,a\_t^i)\) is incomplete because next state also depends on other agents' actions or latent intents.

\[p(s\_{t+1}\mid s\_t,a\_t^i,a\_t^{-i})\]

\[p(s\_{t+1}\mid s\_t,a\_t^i,z\_t^{-i})\]

## 对手建模

Opponent modeling can be integrated by conditioning dynamics on inferred opponent embeddings. This improves prediction and strategic anticipation but increases model complexity and sensitivity to policy drift.

## 基于种群的训练

Population-based training broadens opponent distribution and improves robustness, yet it also increases nonstationarity rate. Stabilization often needs recency-aware replay weighting, slower target updates, and periodic evaluation against fixed policy snapshots.

## 自博弈过拟合

World models in self-play can overfit to transient metas if data refresh is not diverse. Maintaining archived opponent pools and conditioning on opponent fingerprints helps retain broad validity.

**游戏AI实践洞察：**Log opponent identity or policy-hash metadata in replay and feed it into world-model conditioning to reduce nonstationarity-induced prediction collapse.
