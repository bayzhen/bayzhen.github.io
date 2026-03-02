---
layout: article
title: "离线数据与世界模型"
description: "探讨离线世界模型预训练、分布偏移处理、基础模型范式类比与结构化回放数据设计"
level: intermediate
tags: ["离线RL", "预训练"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 8
prev:
  title: "不确定性量化"
  url: "/articles/mbrl-study-notes/07-uncertainty-quantification.html"
next:
  title: "好奇心与主动数据收集"
  url: "/articles/mbrl-study-notes/09-curiosity-and-active-collection.html"
---

## 核心直觉

Offline world-model training turns replay archives into a reusable dynamics prior, but downstream policy optimization must stay conservative under distribution shift.

## 自监督训练

The world model is trained self-supervised on logged trajectories without interaction. This enables large-scale pretraining and broad coverage of dynamics patterns before task-specific optimization.

## 分布偏移与保守策略

The main challenge is policy-induced distribution shift. A new policy can move into state-action regions absent from logs, where model predictions are unreliable. Conservative rollouts and pessimistic value shaping reduce over-optimistic behavior in those regions.

\[\hat Q\_{\text{pess}}(s,a)=\hat Q(s,a)-\beta u(s,a)\]

\[\pi\_{\text{new}} \approx \arg\max\_\pi \mathbb{E}\_{\hat M}[R] \ \text{subject to behavior proximity constraints}\]

## 基础模型范式类比

There is a structural parallel to foundation-model pipelines. First gather diverse data. Then train a general predictive model. Then adapt to downstream control objectives. This enables transfer across tasks and reduces repeated simulator cost.

## 结构化回放数据

Structured replay is usually superior to raw video for control because it includes actions, rewards, terminations, and state metadata. Raw video can still pretrain perception and dynamics priors, but action causality must be inferred and is inherently ambiguous.

**游戏AI实践洞察：**Design replay logging as a long-term asset with consistent action semantics and event tags, because data quality determines how far offline world-model pretraining can scale.
