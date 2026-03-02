---
layout: article
title: "规划与策略优化"
description: "MBRL中的规划与策略优化：Shooting方法、动力学反向传播、MPC与摊销策略"
level: intermediate
tags: ["规划", "MPC", "MBRL"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 5
prev:
  title: "Dreamer V4"
  url: "/articles/mbrl-study-notes/04-dreamer-v4-paradigm-shift.html"
next:
  title: "累积误差与模型利用"
  url: "/articles/mbrl-study-notes/06-compounding-error-and-exploitation.html"
---

## 核心直觉

A learned model supports multiple control modes, from online action-sequence planning to amortized policies trained in imagination.

## Shooting方法

Shooting methods optimize action sequences at decision time. CEM iteratively samples, selects elites, and refits a proposal distribution. MPPI computes weighted trajectory averages around a nominal sequence. These methods are robust and reactive but scale in compute with horizon and action dimension.

\[a\_{t:t+H-1}^\*=\arg\max\_{a\_{t:t+H-1}} \mathbb{E}\_{\hat M}\left[\sum\_{k=0}^{H-1}\gamma^k \hat r\_{t+k}\right]\]

## 动力学反向传播

Backpropagation through dynamics treats planning as differentiable optimization through the world model. It can be efficient in continuous control but sensitive to model smoothness and local optima, especially with discrete or hybrid action spaces.

## Dreamer式Actor-Critic

Dreamer-style actor-critic amortizes planning into policy parameters. Training cost is front-loaded in imagination, while inference is a single policy forward pass. This is ideal under strict runtime budgets.

## MPC与摊销策略

MPC and amortized policy have complementary strengths. MPC adapts online and can partially correct model error via receding horizon updates. Amortized policies are fast and stable at inference but can encode model bias learned during training. Hybrid systems often execute an amortized policy and optionally apply short-horizon MPC corrections in safety-critical moments.

\[a\_t = \pi\_\psi(s\_t) \quad \text{(amortized)}\]

\[a\_t = \text{FirstAction}\!\left(\text{Plan}\_{\hat M}(s\_t)\right) \quad \text{(MPC)}\]

**游戏AI实践洞察：**Use amortized latent policies for baseline control and reserve online planning budget for high-impact tactical decisions where local adaptation is worth the latency.
