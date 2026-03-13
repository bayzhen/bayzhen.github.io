---
layout: article
title: "The Optimization Sprint: 7K to 1.2M SPS"
description: "A step-by-step journey of GPU performance optimization that boosted throughput by 165x"
level: intermediate
tags: ["RL Learner", "English", "Reading"]
series: rl-learner
series_title: "RL Learner: English Reading"
order: 4
prev:
  title: "A Football Pitch on Your GPU"
  url: "03-gpu-environment.html"
next:
  title: "Why Football AI Won't Learn (Yet)"
  url: "05-football-challenge.html"
---

The first version of RL Learner ran at 7,300 steps per second. The current version hits 1.21 million. That is a 165x speedup — not from buying better hardware, but from understanding where time was being wasted.

## The Silent Killer: CUDA Sync

The original GAE implementation called `.item()` on every single time step to pull a value from GPU to CPU. With 180,000 steps per rollout, that triggered 540,000 CUDA synchronization events. Each sync forces the GPU to finish all pending work before returning a single number to Python. The GAE loop alone took 24.8 seconds — not because the math was slow, but because the GPU spent most of its time waiting.

> **Word Notes**
> - *synchronization* /ˌsɪŋkrənaɪˈzeɪʃən/ — 同步。The GPU pauses to hand data back to the CPU, stalling the pipeline.
> - *pending* /ˈpendɪŋ/ — 待处理的。Work that has been submitted but not yet completed.

## Five Steps to 165x

The fix came in stages. First, bulk CPU transfer: instead of pulling one value at a time, the entire rewards and values arrays were copied to CPU in a single operation, and GAE ran as a numpy loop. That brought throughput to 268,000 SPS.

Second, vectorized GAE: the flat array was reshaped into (N agents, T steps) and the loop ran only over T. Four iterations replaced 3.24 million. Result: 340,000 SPS.

Third, `torch.compile`: wrapping the policy network in PyTorch's compiler fused multiple small GPU kernels into fewer, larger ones. That shaved off kernel launch overhead and reached 380,000 SPS.

Fourth, larger minibatches: increasing minibatch size from 4,096 to 32,768 reduced the number of Python-side loop iterations from 176 to 24 per epoch. The GPU finally had enough work per kernel call to stay saturated. This single change nearly tripled throughput to 990,000 SPS.

> **Word Notes**
> - *saturated* /ˈsætʃəreɪtɪd/ — 饱和的。The GPU has enough work to keep all its cores busy.
> - *fused* /fjuːzd/ — 融合的。Multiple small operations combined into one efficient kernel.

## The VRAM Wall

Scaling to 65,536 environments pushed VRAM usage to 9.3 GB on a 12 GB card. Beyond that, the system hit thrashing — GPU memory spilling to system RAM and back. Collection time jumped from 0.3 seconds to over 6 seconds. The sweet spot turned out to be 16,384 environments, balancing throughput against memory pressure.

## Lessons From the Trenches

Every optimization followed the same pattern: measure first, then remove the bottleneck. Intuition was often wrong. The GAE loop seemed trivially fast — it was just addition and multiplication. But the hidden cost of CUDA synchronization dwarfed the arithmetic. Similarly, smaller minibatches seemed safer for training stability, but the Python-loop overhead dominated any algorithmic benefit.

> **Word Notes**
> - *thrashing* /ˈθræʃɪŋ/ — 抖动，颠簸。Memory constantly swapping in and out, destroying performance.
> - *dwarfed* /dwɔːft/ — 使相形见绌。The sync cost was so large it made the math cost invisible.

## Key Takeaways

- CUDA `.item()` calls are invisible performance killers — batch your GPU-to-CPU transfers
- Vectorized GAE over (N, T) replaces millions of scalar steps with a handful of iterations
- Minibatch size affects throughput as much as training quality
- VRAM has a hard cliff — monitor usage and respect the boundary

*Speed was the easy part. Making the agent actually learn football? That is a different battle entirely.*
