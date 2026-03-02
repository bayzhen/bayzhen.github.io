---
layout: article
title: "Dreamer架构：V1到V3"
description: "Dreamer架构演进：RSSM结构、世界模型训练、Actor-Critic与V3鲁棒性特性"
level: advanced
tags: ["Dreamer", "RSSM", "MBRL"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 3
prev:
  title: "世界模型设计"
  url: "/articles/mbrl-study-notes/02-world-model-formulations.html"
next:
  title: "Dreamer V4"
  url: "/articles/mbrl-study-notes/04-dreamer-v4-paradigm-shift.html"
---

## 核心直觉

Dreamer trains a latent dynamics model and then learns actor and critic entirely inside imagined latent trajectories, turning model learning into efficient policy optimization.

## RSSM结构

The RSSM combines deterministic memory and stochastic uncertainty. The deterministic path \(h\_t\) captures long temporal context through recurrence. The stochastic path \(z\_t\) captures multimodal uncertainty and partially observed factors. The model state is \(s\_t=(h\_t,z\_t)\).

\[h\_t = \mathrm{GRU}(h\_{t-1}, z\_{t-1}, a\_{t-1})\]

\[p\_\theta(z\_t\mid h\_t) \quad \text{(prior)}, \qquad q\_\phi(z\_t\mid h\_t,o\_t) \quad \text{(posterior)}\]

\[s\_t=(h\_t,z\_t)\]

## 后验与先验

Posterior and prior are both required. The posterior uses real observations and gives accurate latent inference for training. The prior predicts without observations and is the only path available during imagination. If prior quality is poor, imagined rollouts drift and policy gradients become biased.

## 世界模型训练

World-model training uses reconstruction, reward, continuation, and KL regularization. The ELBO structure keeps latent states predictive yet compact. KL balancing controls which side receives stronger gradient pressure, and free bits prevent premature KL collapse.

\[\mathcal{L}\_{\text{wm}} = \mathbb{E}\_{q\_\phi}\!\left[\sum\_t \log p\_\theta(o\_t\mid s\_t)+\log p\_\theta(r\_t\mid s\_t)+\log p\_\theta(c\_t\mid s\_t)\right] -\sum\_t \mathrm{KL}\!\left(q\_\phi(z\_t\mid h\_t,o\_t)\|p\_\theta(z\_t\mid h\_t)\right)\]

\[\mathcal{L}\_{\text{KL-bal}} = \alpha\,\mathrm{KL}(\mathrm{sg}[q]\|p)+(1-\alpha)\,\mathrm{KL}(q\|\mathrm{sg}[p])\]

\[\mathrm{KL}\_{\text{used}} = \max(\lambda\_{\text{free}}, \mathrm{KL})\]

## V1到V3的演进

V1 used Gaussian latents. V2 and V3 moved to categorical latents, typically factorized with straight-through gradients. Categorical structure improved multimodal representation and often gave more stable control across diverse tasks.

## 想象展开

Imagination starts from posterior states sampled from replay, then unrolls only the prior with policy actions. No real observation is used in these imagined segments.

\[s\_{t+1}\sim p\_\theta(s\_{t+1}\mid s\_t,a\_t), \qquad a\_t\sim \pi\_\psi(a\_t\mid s\_t)\]

\[V\_t^\lambda = \hat r\_t + \hat c\_t\left((1-\lambda)v\_\xi(s\_{t+1})+\lambda V\_{t+1}^\lambda\right)\]

## Actor-Critic

The critic regresses toward \(\lambda\)-returns, and the actor maximizes imagined returns with entropy regularization and gradient flow through latent dynamics.

\[\mathcal{L}\_{\text{critic}} = \mathbb{E}\left[(v\_\xi(s\_t)-\mathrm{sg}[V\_t^\lambda])^2\right]\]

\[\mathcal{J}\_{\text{actor}} = \mathbb{E}\left[\sum\_t \mathrm{sg}[A\_t]\log \pi\_\psi(a\_t\mid s\_t)+\eta\,\mathcal{H}(\pi\_\psi(\cdot\mid s\_t))\right]\]

## V3鲁棒性特性

V3 introduced robustness features that enabled fixed hyperparameters across domains. Symlog and symexp stabilized heavy-tailed targets. Two-hot encoding improved scalar target learning. Percentile normalization reduced sensitivity to reward scale. A 1 percent unimix prevented overconfident categorical probabilities. Adaptive gradient clipping controlled rare optimization spikes.

\[\mathrm{symlog}(x)=\mathrm{sign}(x)\log(1+|x|), \qquad \mathrm{symexp}(y)=\mathrm{sign}(y)(e^{|y|}-1)\]

\[\tilde p=(1-\epsilon)p+\epsilon u,\quad \epsilon=0.01\]

**游戏AI实践洞察：**In Dreamer pipelines, the largest stability gains usually come from world-model numerics and target transforms before any advanced actor objective tuning.
