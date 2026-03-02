---
layout: article
title: "不确定性量化"
description: "探讨MBRL中不确定性量化方法，包括集成分歧估计、不确定性门控展开与校准策略"
level: intermediate
tags: ["不确定性", "集成"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 7
prev:
  title: "累积误差与模型利用"
  url: "/articles/mbrl-study-notes/06-compounding-error-and-exploitation.html"
next:
  title: "离线数据与世界模型"
  url: "/articles/mbrl-study-notes/08-offline-data-and-world-models.html"
---

## 核心直觉

Uncertainty estimation decides where imagination is reliable and where the agent should return to real data collection.

## 偶然不确定性与认知不确定性

Aleatoric uncertainty comes from inherent stochasticity or partial observability and cannot be removed by more data. Epistemic uncertainty comes from limited knowledge and decreases with targeted data collection. For safe model usage, epistemic uncertainty is the key control signal.

## 集成分歧估计

Ensemble disagreement is a practical estimator. Multiple independently trained models predict next state or reward, and dispersion is used as uncertainty proxy. Dropout-based sampling is cheaper but often less calibrated under nonstationary policy updates.

\[u\_t=\mathrm{Var}\_k\!\left[\hat r\_t^{(k)}\right]\]

\[u\_t=\frac{1}{K}\sum\_k \|\hat s\_{t+1}^{(k)}-\bar s\_{t+1}\|^2\]

## 不确定性门控展开

Uncertainty can gate rollout depth by truncating imagination when \(u\_t\) exceeds threshold. It can also reweight imagined losses so uncertain trajectories contribute less to updates.

\[H\_t=\min\{h:\ u\_{t+h}>\tau\}\]

\[w\_t=\exp(-\gamma u\_t),\qquad \mathcal{L}\_{\text{imag}}=\sum\_t w\_t\ell\_t\]

## 校准

A robust loop calibrates uncertainty against held-out fresh trajectories. If uncertainty no longer predicts real prediction error, retrain or diversify the estimator before trusting long-horizon imagination.

**游戏AI实践洞察：**Use uncertainty as an online scheduler for both rollout horizon and real-data budget allocation, not just as an exploration bonus.
