---
layout: article
title: "好奇心与主动数据收集"
description: "内在动机方法（ICM、RND）、噪声电视问题分析与主动学习循环设计"
level: intermediate
tags: ["探索", "好奇心"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 9
prev:
  title: "离线数据与世界模型"
  url: "/articles/mbrl-study-notes/08-offline-data-and-world-models.html"
next:
  title: "多智能体考量"
  url: "/articles/mbrl-study-notes/10-multi-agent-considerations.html"
---

## 核心直觉

Efficient exploration asks for real experience only where the current model is uncertain and task-relevant.

## 内在动机方法

Intrinsic motivation methods convert novelty into reward. ICM uses forward-model feature prediction error. RND uses prediction error against a fixed random target embedding. Both improve sparse-reward exploration but can overvalue stochastic distractions.

## 噪声电视问题

The noisy-TV failure mode appears when aleatoric randomness yields persistent prediction error. The agent repeatedly visits unpredictable but useless states because intrinsic reward remains high. Ensemble disagreement helps separate reducible epistemic uncertainty from irreducible noise.

\[r\_t^{\text{int}} \propto \|f\_\theta(\phi(o\_t),a\_t)-\phi(o\_{t+1})\|^2 \quad \text{(ICM style)}\]

\[r\_t^{\text{int}} \propto \|g(o\_t)-\hat g\_\psi(o\_t)\|^2 \quad \text{(RND style)}\]

## 主动学习循环

A practical active learning loop alternates four stages. Train the world model on current data. Search imagined trajectories for high epistemic uncertainty with potential value. Collect targeted real rollouts in those regions. Retrain and repeat.

\[\mathcal{A}(s,a)=u\_{\text{epi}}(s,a)+\kappa \hat V(s)\]

Imagination-first candidate selection reduces expensive environment interaction and focuses collection on model weaknesses rather than uniform map coverage.

**游戏AI实践洞察：**Treat curiosity as a temporary data-collection controller and anneal it once reward-bearing regions are sufficiently modeled.
