---
layout: article
title: "Dreamer V4：范式转换"
description: "Dreamer V4范式转换：从RSSM到Transformer架构、Shortcut Forcing、PMPO策略优化"
level: advanced
tags: ["Dreamer V4", "Transformer", "MBRL"]
series: mbrl-study-notes
series_title: "MBRL学习笔记"
title_suffix: "MBRL学习笔记"
order: 4
prev:
  title: "Dreamer V1到V3"
  url: "/articles/mbrl-study-notes/03-dreamer-v1-to-v3.html"
next:
  title: "规划与策略优化"
  url: "/articles/mbrl-study-notes/05-planning-and-policy-optimization.html"
---

## 核心直觉

Dreamer V4 reframes world-model RL as large-scale sequence pretraining plus imagination-only policy optimization, shifting from compact RSSM recurrence to scalable token transformers.

## 架构转变

The architectural transition is from \((h\_t,z\_t)\)-based RSSM rollouts to block-causal transformer dynamics over latent tokens. A causal tokenizer compresses high-dimensional video into a tractable token stream while preserving control-relevant structure. This allows large-batch autoregressive training on long gameplay corpora.

\[p\_\theta(x\_{1:T}\mid a\_{1:T-1}) =\prod\_{t=1}^T \prod\_{i=1}^{N\_t} p\_\theta(x\_{t,i}\mid x\_{<t,\le N},x\_{t,<i},a\_{<t})\]

## Shortcut Forcing

V4-style systems use shortcut forcing to reduce generation cost compared with standard diffusion sampling schedules. Instead of many denoising iterations such as 64 steps, training encourages direct jumps across noise or refinement scales, enabling useful samples in around 4 steps. The key gain is control throughput, not only visual quality.

## 大规模无标签数据

Large unlabeled data is central. Pretraining can use thousands of hours of gameplay video with minimal action labels. Where actions are missing, inverse dynamics infers likely controls from temporal changes, improving action-conditioned learning coverage.

\[\hat a\_t \sim p\_\phi(a\_t\mid x\_t,x\_{t+1})\]

## PMPO策略优化

Policy optimization then proceeds in imagination only, using the pretrained world model as the interaction substrate. PMPO-style updates regularize policy improvement to limit exploitation of model errors, typically by trust-region or KL-constrained steps around the previous policy.

\[\pi\_{k+1} =\arg\max\_\pi\; \mathbb{E}\_{s\sim d\_{\pi\_k}^{\hat M},\,a\sim\pi}[Q\_{\pi\_k}^{\hat M}(s,a)] -\frac{1}{\beta}\mathrm{KL}(\pi(\cdot\mid s)\|\pi\_k(\cdot\mid s))\]

## 实时推理与更广泛影响

Real-time inference claims around interactive framerates on one high-end GPU imply a deployment shift: large world models can act online with practical latency, not only as offline research artifacts.

The broader implication is convergence with foundation model workflows. Data collection becomes broad and weakly labeled, model training becomes large-scale self-supervision, and downstream policies are fine-tuned in latent simulation rather than from scratch in real environments.

## 风险与缓解

The main risk remains policy shift beyond model support. Strong policy regularization, uncertainty-aware rollout truncation, and periodic real-environment evaluation are still necessary even in imagination-first regimes.

**游戏AI实践洞察：**Treat world-model pretraining as reusable platform infrastructure; downstream agent variants can then be iterated quickly with low marginal simulator cost.
