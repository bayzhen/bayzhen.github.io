---
layout: article
title: "世界模型设计"
description: "世界模型设计：确定性与随机性转移、观测空间与潜空间、四预测头架构"
level: intermediate
tags: ["世界模型", "潜空间", "MBRL"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 2
prev:
  title: "MBRL核心框架"
  url: "/articles/mbrl-study-notes/01-mbrl-core-framework.html"
next:
  title: "Dreamer V1到V3"
  url: "/articles/mbrl-study-notes/03-dreamer-v1-to-v3.html"
---

## 核心直觉

World-model design is mostly about choosing what state is predicted, where uncertainty is represented, and which heads are needed for control-relevant learning.

## 确定性与随机性转移

Deterministic transitions use a single mapping \(s\_{t+1}=f\_\theta(s\_t,a\_t)\). They are stable and cheap but average out multimodal futures. Stochastic transitions model a distribution \(p\_\theta(s\_{t+1}\mid s\_t,a\_t)\), which handles ambiguity from hidden factors and partial observability.

## 观测空间与潜空间

Observation-space dynamics predict next observations directly. This is expensive and often over-focuses on pixels. Latent-space dynamics encode first, then predict in compact state space, improving optimization and rollout throughput while preserving control features.

## 核心公式

\[p\_\theta(o\_{1:T}, r\_{1:T}, c\_{1:T}, s\_{1:T}\mid a\_{1:T-1}) = \prod\_{t=1}^T p\_\theta(s\_t\mid s\_{t-1},a\_{t-1})\,p\_\theta(o\_t\mid s\_t)\,p\_\theta(r\_t\mid s\_t)\,p\_\theta(c\_t\mid s\_t)\]

\[q\_\phi(s\_t\mid s\_{t-1},a\_{t-1},o\_t)\]

## 四预测头架构

A practical world model usually has four prediction heads. The transition head drives imagined rollouts. The decoder head ensures latent sufficiency by reconstructing observations. The reward head supplies objective estimates in imagination. The continuation or discount head predicts episode persistence and supports variable-horizon return estimation.

## 模型质量是任务相关的

Model quality is task-relative, not image-relative. A crisp decoder can still fail at control if latent reward structure is wrong. A blurry decoder can still produce strong policies if latent transitions and reward predictions remain calibrated along policy-relevant trajectories.

**游戏AI实践洞察：**Optimize latent transition and reward fidelity first, then tune decoder only as much as needed for representation quality and debugging visibility.
